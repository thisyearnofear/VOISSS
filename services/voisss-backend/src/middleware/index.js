const { logger, requestLogger, requestId } = require('./logger');
const { AppError, ValidationError, UnauthorizedError, ForbiddenError, ConflictError, NotFoundError, RateLimitError, errorHandler, asyncHandler } = require('./errors');
const { authMiddleware, bindWalletIdentity } = require('./auth');
const { validateBody, validateParams, validateQuery, schemas } = require('./validate');

module.exports = {
  logger,
  requestLogger,
  requestId,
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  NotFoundError,
  RateLimitError,
  errorHandler,
  asyncHandler,
  authMiddleware,
  bindWalletIdentity,
  validateBody,
  validateParams,
  validateQuery,
  schemas
};
