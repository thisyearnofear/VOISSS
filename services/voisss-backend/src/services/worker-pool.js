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

      const executeOnWorker = (worker) => {
        this.activeWorkers.add(worker);

        worker.once('message', (result) => {
          this.activeWorkers.delete(worker);
          resolve(result);

          // Process next queued task
          if (this.tasks.length > 0) {
            const nextTask = this.tasks.shift();
            executeOnWorker(nextTask.worker);
          }
        });

        worker.once('error', reject);

        worker.postMessage(taskData);
      };

      // Find available worker
      const availableWorker = this.workers.find(w => !this.activeWorkers.has(w));

      if (availableWorker) {
        executeOnWorker(availableWorker);
      } else {
        // Queue task if all workers busy
        task.worker = this.workers[0];
        this.tasks.push(task);
      }
    });
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
