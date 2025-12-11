const { Queue } = require('bullmq');
const IORedis = require('ioredis');

// Create Redis connection with robust retry strategy
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const connection = new IORedis(redisUrl,{
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
        // Stop retrying after 3 attempts if we can't connect
        if (times > 3) {
            console.warn(`[Queue] Redis connection failed after ${times} attempts. Queue will be disabled.`);
            return null;
        }
        return Math.min(times * 100,2000);
    }
});

// Suppress unhandled error logs for ECONNREFUSED to prevent console spam
connection.on('error',(err) => {
    if (err.code !== 'ECONNREFUSED') {
        console.error('[Queue] Redis error:',err);
    }
});

let notificationQueue;
try {
    notificationQueue = new Queue('email-notifications',{
        connection
    });
} catch (error) {
    console.error('[Queue] Failed to initialize queue:',error);
}

const enqueueNotification = async (type,payload) => {
    // Check if redis is actually connected/ready
    if (connection.status !== 'ready') {
        // console.warn('[Queue] Redis not ready, skipping job:', type);
        return;
    }

    try {
        await notificationQueue.add(type,payload,{
            attempts: 5,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
        });
        console.log(`Job enqueued: ${type}`,payload);
    } catch (error) {
        console.error('Error enqueuing job:',error);
    }
};

module.exports = { enqueueNotification,notificationQueue };
