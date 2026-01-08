/**
 * Queue Service
 * Centralized Bull queue management for async jobs
 * PRINCIPLE: DRY - Single source of truth for queue configuration
 */

const Queue = require('bull');

const queues = {};

/**
 * Get or create a queue
 * PRINCIPLE: Lazy initialization, reuse instances
 */
function getQueue(name) {
  if (!queues[name]) {
    queues[name] = new Queue(name, {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: null,
      },
      settings: {
        stalledInterval: 5000,
        maxStalledCount: 2,
        lockDuration: 30000,
        lockRenewTime: 15000,
        retryProcessDelay: 5000,
      },
    });

    queues[name].on('error', (err) => {
      console.error(`Queue "${name}" error:`, err);
    });

    console.log(`Queue initialized: ${name}`);
  }
  return queues[name];
}

/**
 * Close all queues gracefully
 */
async function closeQueues() {
  const promises = Object.entries(queues).map(([name, queue]) => {
    console.log(`Closing queue: ${name}`);
    return queue.close();
  });
  await Promise.all(promises);
  console.log('All queues closed');
}

module.exports = {
  getQueue,
  closeQueues,
};
