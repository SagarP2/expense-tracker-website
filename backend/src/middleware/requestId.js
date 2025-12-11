const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const requestId = (req,res,next) => {
    const id = uuidv4();
    req.id = id;
    res.setHeader('X-Request-Id',id);

    // Log request
    logger.info({
        type: 'request',
        method: req.method,
        url: req.url,
        requestId: id,
        userId: req.user ? req.user.id : undefined, // Might be undefined if before auth
    },'Incoming request');

    next();
};

module.exports = requestId;
