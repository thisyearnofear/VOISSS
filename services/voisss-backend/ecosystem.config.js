const path = require('path');
require('dotenv').config();

const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, 'logs');

module.exports = {
  apps: [
    {
      name: 'voisss-server',
      script: './src/server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5577,
        DATABASE_URL: process.env.DATABASE_URL,
        SKIP_MIGRATIONS: 'false',
      },
      error_file: path.join(LOG_DIR, 'error.log'),
      out_file: path.join(LOG_DIR, 'out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      kill_timeout: 5000,
      listen_timeout: 10000
    },
    {
      name: 'voisss-export-worker',
      script: './src/workers/export-worker.js',
      cwd: __dirname,
      instances: process.env.WORKER_INSTANCES || 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        WORKER_CONCURRENCY: process.env.WORKER_CONCURRENCY || 4,
        WORKER_ID: 'worker-pm2',
        DATABASE_URL: process.env.DATABASE_URL,
        SKIP_MIGRATIONS: 'false',
      },
      error_file: path.join(LOG_DIR, 'worker-error.log'),
      out_file: path.join(LOG_DIR, 'worker-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      kill_timeout: 10000
    }
  ]
};