// Simple in-memory sliding window rate limiter
const ipRequests = new Map();

const rateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute
  const max = options.max || 15; // 15 requests per window
  const message = options.message || 'Too many requests from this IP, please try again later.';

  return (req, res, next) => {
    // In test environment, bypass
    if (process.env.NODE_ENV === 'test') return next();

    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    let record = ipRequests.get(ip);
    if (!record) {
      record = [];
      ipRequests.set(ip, record);
    }

    // Filter out requests older than windowMs
    record = record.filter(timestamp => now - timestamp < windowMs);
    ipRequests.set(ip, record);

    if (record.length >= max) {
      return res.status(429).json({ message });
    }

    record.push(now);
    next();
  };
};

module.exports = rateLimiter;
