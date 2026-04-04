/**
 * Studio Insights - Stream Endpoint
 *
 * POST /api/studio-insights/stream
 *
 * Accepts an audio file via multipart FormData, runs the two-step pipeline
 * (ElevenLabs STT → text analysis), and streams Server-Sent Events back
 * to the client showing each step's progress.
 */

import { NextRequest } from "next/server";
import {
  generateStudioAnalysisWithPipeline,
  type PipelineAnalysisResult,
  type AnalysisStep,
} from "@/lib/ai-inference";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<Response> {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json(
      { error: "Invalid multipart form data" },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return Response.json(
      { error: "Missing or invalid 'file' field" },
      { status: 400 }
    );
  }

  // Convert to base64 for the fallback path
  const arrayBuffer = await file.arrayBuffer();
  const audioBase64 = Buffer.from(arrayBuffer).toString("base64");
  const mimeType = file.type || "audio/webm";

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(event: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      }

      try {
        const result: PipelineAnalysisResult =
          await generateStudioAnalysisWithPipeline(
            file,
            audioBase64,
            mimeType,
            (event: { step: AnalysisStep; steps: AnalysisStep[]; transcript?: string }) => {
              sendEvent("progress", { step: event.step, steps: event.steps });

              if (event.transcript) {
                sendEvent("transcript", { text: event.transcript });
              }
            }
          );

        sendEvent("complete", {
          insights: result.insights,
          humanityCertificate: result.humanityCertificate,
          provider: result.provider,
          model: result.model,
          transcript: result.transcript,
          mode: result.mode,
          steps: result.steps,
        });
      } catch (error) {
        sendEvent("error", {
          message:
            error instanceof Error ? error.message : "Pipeline failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
