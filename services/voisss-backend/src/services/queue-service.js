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
    const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`;
    console.log(`📡 Queue "${name}" connecting to ${redisUrl}`);

    queues[name] = new Queue(name, redisUrl, {
      settings: {
        // Optimizing for fast recovery: shorter locks with frequent checks
        stalledInterval: 30000,    // Check for stalled jobs every 30 seconds
        maxStalledCount: 2,        // Limit stall attempts to avoid infinite loops
        lockDuration: 30000,       // 30 second lock (renewed automatically by Bull)
        lockRenewTime: 10000,      // Renew lock every 10 seconds
        retryProcessDelay: 5000,   // Wait 5s before retry
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
