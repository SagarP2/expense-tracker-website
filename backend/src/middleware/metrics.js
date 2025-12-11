const { httpRequestDurationMicroseconds } = require('../metrics/metrics');

const metricsMiddleware = (req,res,next) => {
    const end = httpRequestDurationMicroseconds.startTimer();
    res.on('finish',() => {
        end({ route: req.route ? req.route.path : req.path,code: res.statusCode,method: req.method });
    });
    next();
};

module.exports = metricsMiddleware;
