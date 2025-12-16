# Routeway AI Integration

This project integrates with [Routeway](https://routeway.ai) to provide free access to large language models, including Kimi K2 and other open models.

## Setup

1. Ensure you have a `.env` file in the project root with your API key:
   ```bash
   ROUTEWAY_API_KEY=your_api_key_here
   ```

2. The API key is automatically loaded in development environments.

## Security Measures

For production use, this integration includes several security measures:

- **Input Sanitization**: All user inputs are filtered for potentially harmful content
- **Input Validation**: Content is validated to meet quality standards
- **Prompt Injection Prevention**: Common attack vectors are filtered out
- **API Key Protection**: API keys are not exposed in client-side code

## Usage

### Basic Usage
```typescript
import { initializeRoutewayService } from '@voisss/shared';

const service = initializeRoutewayService(); // Gets API key from env
if (service) {
  const response = await service.sendMessage('Your message');
}
```

### Secure Usage (Recommended for user-generated content)
```typescript
import { 
  initializeRoutewayService, 
  createSafeRoutewayWrapper 
} from '@voisss/shared';

const service = initializeRoutewayService();
const safeRouteway = createSafeRoutewayWrapper(service);

try {
  // This automatically sanitizes and validates user input
  const response = await safeRouteway.safeSendMessage(userInput);
} catch (error) {
  console.error('Safe message error:', error);
}
```

### Input Sanitization
```typescript
import { sanitizeUserInput, validateUserInput } from '@voisss/shared';

const rawInput = req.body.userMessage;
const sanitizedInput = sanitizeUserInput(rawInput);
if (validateUserInput(sanitizedInput)) {
  // Process the valid input
}
```

## Available Models

By default, the integration uses `kimi-k2-0905:free` which is currently free on Routeway.

## Best Practices for VOISSS

- Always use the `safeRouteway` wrapper for user-generated content
- Sanitize inputs before sending to the API
- Handle API errors gracefully
- Monitor usage (though currently unlimited on free tier)
- Consider caching responses for repeated queries