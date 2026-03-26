import { z } from "zod";
import { NextResponse } from "next/server";

/**
 * Extract a human-readable error message from a Zod error.
 */
export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map(e => `${e.path.join('.')}: ${e.message}`)
    .join(', ');
}

/**
 * Parse and validate a request body with a Zod schema.
 * Returns the parsed data or throws a NextResponse with 400 status.
 *
 * Usage:
 *   const body = await parseBody(req, MySchema);
 */
export async function parseBody<T extends z.ZodTypeAny>(
  req: Request,
  schema: T
): Promise<z.infer<T>> {
  const body = await req.json();
  return schema.parse(body);
}

/**
 * Wrap an API handler with Zod error handling.
 * Returns 400 with formatted error message on validation failure.
 *
 * Usage:
 *   return withValidation(req, MySchema, async (data) => {
 *     // data is typed and validated
 *     return NextResponse.json({ success: true, data });
 *   });
 */
export async function withValidation<T extends z.ZodTypeAny>(
  req: Request,
  schema: T,
  handler: (data: z.infer<T>) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    return handler(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: `Validation error: ${formatZodError(error)}`,
      }, { status: 400 });
    }
    throw error;
  }
}
