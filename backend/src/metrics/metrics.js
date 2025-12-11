const client = require('prom-client');

const register = new client.Registry();

client.collectDefaultMetrics({ register });

const httpRequestDurationMicroseconds = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method','route','code'],
    buckets: [0.1,0.5,1,1.5,2,5]
});

register.registerMetric(httpRequestDurationMicroseconds);

module.exports = {
    register,
    httpRequestDurationMicroseconds
};
