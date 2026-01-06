import aj from '#config/arcjet.js';
import { slidingWindow } from '@arcjet/node';
import logger from '#config/logger.js';

const securityMiddleware = async (req, res, next) => {
  try {
    const role = req.user?.role || 'guest';

    let limit;
    let messege;

    switch (role) {
      case 'admin':
        limit = 20;
        messege = 'Admin request limit exceeded (20 per minute). Slow down.';
        break;
      case 'user':
        limit = 10;
        messege = 'User request limit exceeded (10 per minute). Slow down.';
        break;
      case 'guest':
        limit = 5;
        messege = 'Guest request limit exceeded (5 per minute). Slow down.';
        break;
    }

    const client = aj.withRule(
      slidingWindow({
        mode: 'LIVE',
        interval: '1m',
        max: limit,
        name: `${role}-rate-limit`,
      })
    );

    const decision = await client.protect(req);

    if (decision.isDenied() && decision.reason.isBot()) {
      logger.warn('Bot request blocked', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });
      return res.status(403).send({
        error: 'Forbidden',
        message: `Automated requests are no allowed & ${messege}`,
      });
    }

    if (decision.isDenied() && decision.reason.isRateLimit()) {
      logger.warn('Shield Blocked request', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });
      return res.status(403).send({
        error: 'Forbidden',
        message: `Requests are blocked by security policy & ${messege}`,
      });
    }

    if (decision.isDenied() && decision.reason.isBot()) {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });
      return res.status(403).send({
        error: 'Forbidden',
        message: `Too many request & ${messege}`,
      });
    }
    next();
  } catch (e) {
    console.error('Arcjet Middleware Error', e);
    res.status(500).json({
      error: 'Arcjet Middleware Error',
      message: 'Something went wrong with security middleware',
    });
  }
};
export default securityMiddleware;
