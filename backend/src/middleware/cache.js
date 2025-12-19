const { redis } = require('../utils/cache');

// Middleware to cache GET requests
const cache = (duration) => {
    return async (req, res, next) => {
        if (req.method !== 'GET') {
            return next();
        }

        const key = `cache:${req.originalUrl || req.url}:${JSON.stringify(req.user ? req.user._id : 'public')}`;

        try {
            const cachedResponse = await redis.get(key);
            if (cachedResponse) {
                res.setHeader('X-Cache', 'HIT');
                res.setHeader('Server-Timing', `cache;desc="Redis Cache Hit";dur=0`); // Dummy dur
                return res.json(JSON.parse(cachedResponse));
            }
            res.setHeader('X-Cache', 'MISS');

            // Monkey patch res.json to cache the response
            const originalJson = res.json;
            res.json = (body) => {
                // Fire and forget cache set (don't await)
                // Also stringify might be expensive for large objects, so we could use a faster library or do it asynchronously if possible
                // For now, let's just make sure redis network call doesn't block response
                originalJson.call(res, body);

                // Cache after sending response
                (async () => {
                    try {
                        await redis.set(key, JSON.stringify(body), 'EX', duration);
                    } catch (err) {
                        console.error('Cache set error:', err);
                    }
                })();
            };

            const start = Date.now();
            res.on('finish', () => {
                const diff = Date.now() - start;
                // Note: headers are already sent by the time finish fires, so we can't add header here easily for this request
                // But we could add it before res.json
            });

            next();
        } catch (error) {
            console.error('Redis cache error:', error);
            next();
        }
    };
};

// Helper to invalidate cache
// This uses a pattern match to find keys (Scan), which can be slow on very large DBs but fine for this scale
// Or we can just invalidate specific known keys if we construct them deterministically.
// For now, let's invalidate all keys for a specific user.
const invalidateUserCache = async (userId) => {
    if (!userId) return;
    try {
        const pattern = `cache:*/api/transactions*${userId}*`;
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(keys);
        }
    } catch (error) {
        console.error('Cache invalidation error:', error);
    }
};

module.exports = { cache, invalidateUserCache };
