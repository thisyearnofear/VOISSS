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
    console.log(`📡 Queue "${name}" using Redis at ${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`);

    queues[name] = new Queue(name, {
      redis: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: null,
      },
      settings: {
        stalledInterval: 30000,
        maxStalledCount: 3,
        lockDuration: 60000,
        lockRenewTime: 20000,
        retryProcessDelay: 5000,
      },
    });

    queues[name].on('error', (err) => {
      console.error(`❌ Queue "${name}" error:`, err);
    });

    queues[name].on('waiting', (jobId) => {
      console.log(`⏳ Job ${jobId} is waiting in queue "${name}"`);
    });

    queues[name].on('stalled', (jobId) => {
      console.warn(`⚠️  Job ${jobId} stalled in queue "${name}"`);
    });

    queues[name].on('ready', () => {
      console.log(`✅ Queue "${name}" connected to Redis`);
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
