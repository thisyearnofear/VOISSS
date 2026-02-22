const { logger, requestLogger, requestId } = require('./logger');
const { AppError, ValidationError, UnauthorizedError, NotFoundError, RateLimitError, errorHandler, asyncHandler } = require('./errors');
const { authMiddleware, optionalAuth } = require('./auth');
const { validateBody, validateParams, validateQuery, schemas } = require('./validate');

module.exports = {
  logger,
  requestLogger,
  requestId,
  AppError,
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  RateLimitError,
  errorHandler,
  asyncHandler,
  authMiddleware,
  optionalAuth,
  validateBody,
  validateParams,
  validateQuery,
  schemas
};
