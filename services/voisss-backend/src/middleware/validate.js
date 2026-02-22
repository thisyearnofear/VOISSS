const { z } = require('zod');
const { ValidationError } = require('./errors');

function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }));
        next(new ValidationError('Validation failed', details));
      } else {
        next(error);
      }
    }
  };
}

function validateParams(schema) {
  return (req, res, next) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }));
        next(new ValidationError('Invalid parameters', details));
      } else {
        next(error);
      }
    }
  };
}

function validateQuery(schema) {
  return (req, res, next) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }));
        next(new ValidationError('Invalid query parameters', details));
      } else {
        next(error);
      }
    }
  };
}

const schemas = {
  jobId: z.object({
    jobId: z.string().min(1).max(100).regex(/^[\w-]+$/, 'Invalid job ID format')
  }),

  userId: z.object({
    userId: z.string().min(1).max(100)
  }),

  pagination: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0)
  }),

  ethereumAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),

  exportRequest: z.object({
    kind: z.enum(['mp3', 'mp4']),
    audioUrl: z.string().url().optional(),
    transcriptId: z.string().min(1),
    templateId: z.string().optional(),
    userId: z.string().optional(),
    manifest: z.object({
      segments: z.array(z.object({
        startMs: z.number(),
        endMs: z.number(),
        text: z.string()
      }))
    }).optional(),
    style: z.record(z.unknown()).optional()
  }),

  missionCreate: z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    reward: z.number().min(0).optional(),
    expiresAt: z.string().datetime().optional()
  }),

  missionAccept: z.object({
    missionId: z.string().min(1),
    userId: z.string().min(1)
  })
};

module.exports = { validateBody, validateParams, validateQuery, schemas };
