const { Queue } = require('bullmq');
const IORedis = require('ioredis');

// Only initialize Redis-backed queue if REDIS_URL is explicitly provided
const redisUrl = process.env.REDIS_URL;

let connection;
let notificationQueue;

if (redisUrl) {
    connection = new IORedis(redisUrl,{
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        retryStrategy(times) {
            if (times > 3) {
                console.warn(`[Queue] Redis connection failed after ${times} attempts. Queue will be disabled.`);
                return null;
            }
            return Math.min(times * 100,2000);
        }
    });

    connection.on('error',(err) => {
        if (err.code !== 'ECONNREFUSED') {
            console.error('[Queue] Redis error:',err);
        }
    });

    try {
        notificationQueue = new Queue('email-notifications',{ connection });
    } catch (error) {
        console.error('[Queue] Failed to initialize queue:',error);
    }
} else {
    console.log('[Queue] REDIS_URL not set. Queue is disabled in this environment.');
}

const enqueueNotification = async (type,payload) => {
    if (!notificationQueue || !connection || connection.status !== 'ready') {
        return;
    }
    try {
        await notificationQueue.add(type,payload,{
            attempts: 5,
            backoff: { type: 'exponential',delay: 1000 },
        });
        console.log(`Job enqueued: ${type}`,payload);
    } catch (error) {
        console.error('Error enqueuing job:',error);
    }
};

module.exports = { enqueueNotification,notificationQueue };
