const pino = require('pino');

const isDev = process.env.NODE_ENV !== 'production';

const transport = isDev
  ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
  : undefined;

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport,
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      query: req.query,
      headers: { 'content-type': req.headers['content-type'], 'user-agent': req.headers['user-agent'] }
    }),
    res: (res) => ({ statusCode: res.statusCode }),
    err: pino.stdSerializers.err
  }
});

function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      req,
      res,
      duration,
      requestId: req.id
    }, 'request completed');
  });

  next();
}

function requestId(req, res, next) {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
}

module.exports = { logger, requestLogger, requestId };
