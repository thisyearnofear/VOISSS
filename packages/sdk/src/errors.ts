/**
 * Base error class for VOISSS SDK
 */
export class VoisssError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'VoisssError';
  }
}

/**
 * Error thrown when payment is required
 */
export class PaymentRequiredError extends VoisssError {
  constructor(
    message: string,
    public paymentDetails: {
      amount: string;
      currency: string;
      reason: string;
    }
  ) {
    super(message, 402, paymentDetails);
    this.name = 'PaymentRequiredError';
  }
}

/**
 * Error thrown when rate limit is exceeded
 */
export class RateLimitError extends VoisssError {
  constructor(
    message: string,
    public retryAfter?: number
  ) {
    super(message, 429, { retryAfter });
    this.name = 'RateLimitError';
  }
}
