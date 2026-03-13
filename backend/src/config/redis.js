// src/config/redis.js
// Redis connection with graceful fallback.
// If Redis is unavailable, the app continues to work without caching.

import Redis from "ioredis";
import logger from "../utils/logger.js";

let redis = null;
let isRedisAvailable = false;

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

try {
    redis = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
            if (times > 3) {
                logger.warn("Redis: max retries exceeded, stopping reconnection");
                return null; // Stop retrying
            }
            return Math.min(times * 200, 2000);
        },
        lazyConnect: true, // Don't connect until first use
    });

    redis.on("connect", () => {
        isRedisAvailable = true;
        logger.info("Redis connected");
    });

    redis.on("error", (err) => {
        isRedisAvailable = false;
        logger.warn("Redis error:", err.message);
    });

    redis.on("close", () => {
        isRedisAvailable = false;
        logger.info("Redis disconnected");
    });

    // Attempt connection
    await redis.connect().catch(() => {
        logger.warn("Redis: initial connection failed — caching disabled");
    });
} catch (error) {
    logger.warn("Redis: failed to initialize —", error.message);
}

export const getRedisClient = () => redis;
export const isRedisConnected = () => isRedisAvailable;
export default redis;
