/**
 * ACP Listener Worker
 * 
 * Background worker that autonomously discovers and responds to 
 * voice-related job opportunities on the Virtuals Protocol marketplace.
 */

const { getAcpListener } = require('@voisss/shared/server');
const pino = require('pino');
const logger = pino({
  name: 'acp-listener-worker',
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty'
  }
});

async function startWorker() {
  logger.info('Initializing ACP Listener Worker...');

  try {
    const listener = getAcpListener({
      autoBid: process.env.ACP_AUTO_BID === 'true',
      minBudget: parseFloat(process.env.ACP_MIN_BUDGET || '0.01'),
      // Agent ID and Offering IDs are read from env by getAcpListener
    });

    logger.info(`Starting listener for agent: ${process.env.ACP_AGENT_ID}`);
    
    await listener.start();

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, stopping listener...');
      await listener.stop();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, stopping listener...');
      await listener.stop();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start ACP Listener Worker:', error);
    process.exit(1);
  }
}

// Only start if this file is run directly
if (require.main === module) {
  startWorker();
}

module.exports = { startWorker };
