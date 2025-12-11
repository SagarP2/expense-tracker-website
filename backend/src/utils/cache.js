const Redis = require('ioredis');

let redis;
let isRedisAvailable = false;

try {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379',{
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        retryStrategy(times) {
            if (times > 3) {
                console.warn('Redis connection failed, switching to no-op mode.');
                return null; // Stop retrying
            }
            return Math.min(times * 100,2000);
        }
    });

    redis.on('error',(err) => {
        // Suppress connection errors to avoid crashing
        if (err.code !== 'ECONNREFUSED') {
            console.warn('Redis error (Cache):',err.message);
        }
        isRedisAvailable = false;
    });

    redis.on('connect',() => {
        console.log('Redis connected (Cache)');
        isRedisAvailable = true;
    });
} catch (e) {
    console.warn('Could not initialize Redis client:',e.message);
}

const get = async (key) => {
    if (!isRedisAvailable || !redis) return null;
    try {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        return null; // Fail safe
    }
};

const set = async (key,value,ttl = 60) => {
    if (!isRedisAvailable || !redis) return;
    try {
        await redis.set(key,JSON.stringify(value),'EX',ttl);
    } catch (err) {
        // Ignore
    }
};

const del = async (key) => {
    if (!isRedisAvailable || !redis) return;
    try {
        await redis.del(key);
    } catch (err) {
        // Ignore
    }
};

module.exports = { get,set,del,redis };
