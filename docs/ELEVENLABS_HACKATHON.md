# ElevenLabs x Firecrawl Hackathon Setup Guide

VOISSS has been enhanced with real-time web intelligence using Firecrawl! Follow these steps to complete the integration in the ElevenLabs dashboard for the hackathon.

## 1. Environment Variables
Ensure you have the following keys in your `.env` file:
```env
FIRECRAWL_API_KEY=your_firecrawl_api_key
ELEVENLABS_AGENT_ID=your_agent_id
ELEVENLABS_AGENT_TOKEN=a_secure_random_token_for_tools
```

## 2. Configure the Tool in ElevenLabs
Go to your Agent configuration in the ElevenLabs Dashboard and add a new **Web Search** tool.

### Tool Definition
- **Name:** `web_search`
- **Description:** Searches the web for real-time information, news, and project details. Use this when the user asks about current events or things not in your training data.
- **Type:** `webhook`

### Webhook Configuration
- **URL:** `https://your-deployment.com/api/tools/web-search` (Use your Ngrok or Vercel URL)
- **Method:** `POST`
- **Authentication:** `Secret` -> Value: `Bearer your_secure_random_token_for_tools` (Must match `ELEVENLABS_AGENT_TOKEN`)

### Parameters (JSON Schema)
```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "The search query to look up on the web"
    },
    "limit": {
      "type": "integer",
      "description": "Number of results to return (1-5)",
      "default": 3
    }
  },
  "required": ["query"]
}
```

## 3. System Prompt Update
Update your Agent's System Prompt in ElevenLabs to encourage using the tool:

```text
You have access to a 'web_search' tool. Use it whenever you need real-time information 
about the web, crypto news, or VOISSS project updates. If a user asks a question 
you don't have the answer to, search the web!
```

## 4. Verification
Run the local test script to ensure your endpoint is working correctly:
```bash
npx ts-node scripts/test-firecrawl-tool.ts
```

Good luck with the hackathon! 🚀
