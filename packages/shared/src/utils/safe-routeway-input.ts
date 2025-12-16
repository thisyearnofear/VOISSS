import { createRoutewayService, RoutewayService } from '../services/routeway-service';

/**
 * Sanitizes user input to prevent prompt injection and other malicious inputs
 * @param input - Raw user input that needs to be sanitized
 * @returns Sanitized input safe for API usage
 */
export const sanitizeUserInput = (input: string): string => {
  // Limit input length to prevent overly large requests
  const maxLength = 1000; // Adjust based on your needs
  if (input.length > maxLength) {
    input = input.substring(0, maxLength);
  }

  // Remove potentially harmful sequences
  // Prevent common injection patterns
  input = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  input = input.replace(/javascript:/gi, '');
  input = input.replace(/vbscript:/gi, '');

  // Remove potential API key leaks in user input
  input = input.replace(/(?:sk-|api-|token-)?[a-zA-Z0-9]{32,}/gi, '[REDACTED]');

  // Normalize whitespace
  input = input.trim();

  return input;
};

/**
 * Validates that user input meets minimum quality standards
 * @param input - User input to validate
 * @returns Boolean indicating if input is valid
 */
export const validateUserInput = (input: string): boolean => {
  if (!input || input.trim().length === 0) {
    return false;
  }

  // Check for minimum length
  if (input.trim().length < 3) {
    return false;
  }

  // Check for excessive repetition which might indicate spam
  const words = input.split(/\s+/);
  const uniqueWords = new Set(words);
  if (uniqueWords.size < words.length / 4) { // More than 75% repetition
    return false;
  }

  return true;
};

/**
 * Creates a safe Routeway service wrapper that sanitizes inputs
 */
export interface SafeRoutewayService {
  safeSendMessage: (content: string, model?: string) => Promise<string>;
}

export const createSafeRoutewayWrapper = (service: RoutewayService | null): SafeRoutewayService => {
  return {
    safeSendMessage: async (content: string, model: string = 'kimi-k2-0905:free'): Promise<string> => {
      if (!service) {
        throw new Error('Routeway service not initialized. Check ROUTEWAY_API_KEY environment variable.');
      }

      // Sanitize and validate the input
      const sanitizedInput = sanitizeUserInput(content);
      
      if (!validateUserInput(sanitizedInput)) {
        throw new Error('Invalid input: Input does not meet quality standards');
      }

      try {
        const response = await service.sendMessage(sanitizedInput, model);
        return response;
      } catch (error) {
        console.error('Error in safeSendMessage:', error);
        throw error;
      }
    }
  };
};