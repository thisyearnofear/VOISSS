/**
 * OpenAPI 3.0 Spec Generator
 *
 * Reads the canonical route registry (packages/shared/src/api/routes.ts)
 * and generates a complete OpenAPI 3.0 specification file.
 *
 * Usage: tsx scripts/generate-openapi.ts > apps/web/public/openapi.json
 *
 * The output replaces the hand-written legacy spec at
 * apps/web/src/app/api/agents/openapi.json/route.ts.
 */

import { ROUTES } from '../packages/shared/src/api/routes';

interface OpenAPIPath {
  [method: string]: {
    operationId: string;
    summary: string;
    description?: string;
    tags: string[];
    parameters?: unknown[];
    requestBody?: unknown;
    responses: Record<string, unknown>;
  };
}

function methodToOpenAPIOperation(method: string): string {
  return method.toLowerCase();
}

function pathToOpenAPIPath(path: string): string {
  return path.replace(/\[(\w+)\]/g, '{$1}');
}

function generateSpec() {
  const paths: Record<string, OpenAPIPath> = {};
  const tagSet = new Set<string>();

  for (const route of ROUTES) {
    if (route.status !== 'live') continue;

    const openapiMethod = methodToOpenAPIOperation(route.method);
    const openapiPath = pathToOpenAPIPath(route.path);
    const group = route.group;

    tagSet.add(group);

    if (!paths[openapiPath]) {
      paths[openapiPath] = {};
    }

    const operation = {
      operationId: `${openapiMethod}${route.path.replace(/[^a-zA-Z0-9]/g, '_')}`,
      summary: route.summary,
      description: route.description || route.summary,
      tags: [group],
      parameters: [] as unknown[],
      responses: {
        '200': {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { type: 'object' },
                },
              },
            },
          },
        },
        '400': {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', enum: [false] },
                  error: { type: 'string' },
                },
              },
            },
          },
        },
      },
    };

    // Extract path parameters
    const pathParams = openapiPath.match(/\{(\w+)\}/g);
    if (pathParams) {
      for (const param of pathParams) {
        const name = param.slice(1, -1);
        operation.parameters.push({
          name,
          in: 'path',
          required: true,
          schema: { type: 'string' },
        });
      }
    }

    // Add auth info as description note
    if (route.auth === 'required' || route.auth === 'admin') {
      operation.parameters.push({
        name: 'Authorization',
        in: 'header',
        required: route.auth === 'required',
        schema: { type: 'string' },
        description: route.auth === 'admin' ? 'Admin API key' : 'Bearer token or wallet signature',
      });
    }

    paths[openapiPath][openapiMethod] = operation as any;
  }

  const tags = Array.from(tagSet).map((name) => ({
    name,
    description: `${name.charAt(0).toUpperCase() + name.slice(1)} API operations`,
  }));

  const spec = {
    openapi: '3.0.3',
    info: {
      title: 'VOISSS Agent API',
      description:
        'Programmatic API for AI agents to interact with the VOISSS voice marketplace. License authentic human voices, generate speech, and manage voice assets with blockchain provenance.',
      version: '1.0.0',
      contact: {
        email: 'hello@voisss.xyz',
        url: 'https://voisss.netlify.app',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'https://voisss.netlify.app',
        description: 'Production',
      },
    ],
    paths,
    tags,
  };

  return spec;
}

const spec = generateSpec();
console.log(JSON.stringify(spec, null, 2));
