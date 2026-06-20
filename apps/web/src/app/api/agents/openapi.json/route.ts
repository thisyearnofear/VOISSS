import { NextResponse } from 'next/server';
import { ROUTES, type HttpMethod } from '@voisss/shared/api/routes';

function methodToOpenAPI(method: string): string {
  return method.toLowerCase();
}

function pathToOpenAPI(path: string): string {
  return path.replace(/\[(\w+)\]/g, '{$1}');
}

function generateSpec() {
  const paths: Record<string, any> = {};
  const tagSet = new Set<string>();

  for (const route of ROUTES) {
    if (route.status !== 'live') continue;

    const openapiMethod = methodToOpenAPI(route.method);
    const openapiPath = pathToOpenAPI(route.path);
    tagSet.add(route.group);

    if (!paths[openapiPath]) {
      paths[openapiPath] = {};
    }

    const parameters: any[] = [];

    const pathParams = openapiPath.match(/\{(\w+)\}/g);
    if (pathParams) {
      for (const param of pathParams) {
        const name = param.slice(1, -1);
        parameters.push({
          name,
          in: 'path',
          required: true,
          schema: { type: 'string' },
        });
      }
    }

    if (route.auth === 'required' || route.auth === 'admin') {
      parameters.push({
        name: 'Authorization',
        in: 'header',
        required: route.auth === 'required',
        schema: { type: 'string' },
        description:
          route.auth === 'admin' ? 'Admin API key' : 'Bearer token or wallet signature',
      });
    }

    paths[openapiPath][openapiMethod] = {
      operationId: `${openapiMethod}${route.path.replace(/[^a-zA-Z0-9]/g, '_')}`,
      summary: route.summary,
      description: route.description || route.summary,
      tags: [route.group],
      parameters: parameters.length > 0 ? parameters : undefined,
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
        '500': {
          description: 'Internal server error',
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
  }

  return {
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
    tags: Array.from(tagSet).map((name) => ({
      name,
      description: `${name.charAt(0).toUpperCase() + name.slice(1)} API operations`,
    })),
  };
}

export async function GET() {
  return NextResponse.json(generateSpec(), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export const dynamic = 'force-static';
