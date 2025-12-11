const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

const globalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 200, // 200 requests per IP
    message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10,
    message: { error: 'Too many login attempts, please try again after 5 minutes.' }
});

const authSpeedLimiter = slowDown({
    windowMs: 5 * 60 * 1000, // 5 minutes
    delayAfter: 5, // allow 5 requests per 5 minutes, then...
    delayMs: (hits) => hits * 100, // add 100ms per request above 5
});

module.exports = { globalLimiter,authLimiter,authSpeedLimiter };
