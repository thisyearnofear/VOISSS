/**
 * Worker Thread Pool
 * Efficiently parallelizes frame rendering across CPU cores
 * PRINCIPLE: PERFORMANT - CPU-bound tasks on separate threads
 */

const { Worker } = require('worker_threads');
const path = require('path');
const os = require('os');

class WorkerPool {
  constructor(poolSize = null) {
    this.poolSize = poolSize || Math.max(2, os.cpus().length - 1);
    this.workers = [];
    this.tasks = [];
    this.activeWorkers = new Set();

    console.log(`🧵 Worker pool initialized: ${this.poolSize} threads`);
  }

  /**
   * Initialize worker pool
   */
  initializePool() {
    for (let i = 0; i < this.poolSize; i++) {
      const worker = new Worker(path.join(__dirname, 'render-worker.js'));

      worker.on('error', (err) => {
        console.error(`Worker ${i} error:`, err);
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          console.error(`Worker ${i} exited with code ${code}`);
        }
      });

      this.workers.push(worker);
    }
  }

  /**
   * Execute task on next available worker
   */
  async executeTask(taskData) {
    if (this.workers.length === 0) {
      this.initializePool();
    }

    return new Promise((resolve, reject) => {
      const task = { taskData, resolve, reject };

      // Find available worker
      const availableWorker = this.workers.find(w => !this.activeWorkers.has(w));

      if (availableWorker) {
        this._dispatch(availableWorker, task);
      } else {
        // Queue task if all workers busy
        this.tasks.push(task);
      }
    });
  }

  /**
   * Dispatch task to a specific worker
   * @private
   */
  _dispatch(worker, task) {
    this.activeWorkers.add(worker);

    const messageHandler = (result) => {
      worker.off('error', errorHandler);
      this.activeWorkers.delete(worker);
      task.resolve(result);

      // Process next queued task if any
      if (this.tasks.length > 0) {
        const nextTask = this.tasks.shift();
        this._dispatch(worker, nextTask);
      }
    };

    const errorHandler = (err) => {
      worker.off('message', messageHandler);
      this.activeWorkers.delete(worker);
      task.reject(err);

      // Even on error, the worker might be reusable or need replacement
      // For now, just try to process next task
      if (this.tasks.length > 0) {
        const nextTask = this.tasks.shift();
        this._dispatch(worker, nextTask);
      }
    };

    worker.once('message', messageHandler);
    worker.once('error', errorHandler);
    worker.postMessage(task.taskData);
  }

  /**
   * Terminate all workers
   */
  async terminate() {
    const promises = this.workers.map(worker => worker.terminate());
    await Promise.all(promises);
    this.workers = [];
    console.log('✅ Worker pool terminated');
  }
}

// Singleton pool
let pool = null;

function getWorkerPool(poolSize) {
  if (!pool) {
    pool = new WorkerPool(poolSize);
  }
  return pool;
}

async function terminateWorkerPool() {
  if (pool) {
    await pool.terminate();
    pool = null;
  }
}

module.exports = {
  getWorkerPool,
  terminateWorkerPool,
};
