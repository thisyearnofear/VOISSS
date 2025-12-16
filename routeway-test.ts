import { createRoutewayService } from './packages/shared/src/services/routeway-service';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testRoutewayIntegration() {
  console.log('Testing Routeway integration...\n');

  const apiKey = process.env.ROUTEWAY_API_KEY;
  if (!apiKey) {
    console.error('ROUTEWAY_API_KEY environment variable is not set!');
    process.exit(1);
  }

  try {
    console.log('Creating Routeway service instance...');
    const routewayService = createRoutewayService(apiKey);

    console.log('Making a test request to Routeway API...');
    const response = await routewayService.sendMessage(
      'Hello! This is a test message from the VOISSS project. Can you confirm you received this message?',
      'kimi-k2-0905:free'
    );

    console.log('\n--- RESPONSE RECEIVED ---');
    console.log('Response content:', response);
    console.log('------------------------\n');

    console.log('✅ Routeway integration test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during Routeway integration test:', error);
    process.exit(1);
  }
}

// Run the test
testRoutewayIntegration();