import { createRoutewayService, RoutewayService } from '../services/routeway-service';

/**
 * Initializes the Routeway service with API key from environment variables
 * @returns RoutewayService instance or null if API key is not available
 */
export const initializeRoutewayService = (): RoutewayService | null => {
  const apiKey = process.env.ROUTEWAY_API_KEY;
  
  if (!apiKey) {
    console.warn('ROUTEWAY_API_KEY environment variable is not set. Routeway functionality will be disabled.');
    return null;
  }

  try {
    return createRoutewayService(apiKey);
  } catch (error) {
    console.error('Failed to initialize Routeway service:', error);
    return null;
  }
};

/**
 * Validates the Routeway API key by making a simple test request
 * @param service - Initialized Routeway service instance
 * @returns Promise<boolean> indicating if the API key is valid
 */
export const validateRoutewayApiKey = async (service: RoutewayService): Promise<boolean> => {
  try {
    // Test with a minimal request to validate the API key
    const response = await service.listModels();
    
    if (response && typeof response === 'object') {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Routeway API key validation failed:', error);
    return false;
  }
};