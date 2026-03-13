// src/utils/cache.js
// Thin caching helpers over Redis. Every function is safe to call
// even when Redis is down — they silently return null / false
// so the caller always falls through to the database.

import { getRedisClient, isRedisConnected } from "../config/redis.js";
import logger from "./logger.js";

const DEFAULT_TTL = 300; // 5 minutes

/**
 * Get a cached value by key.
 * @returns {any|null} Parsed JSON value, or null if miss / error.
 */
export const cacheGet = async (key) => {
    if (!isRedisConnected()) return null;
    try {
        const data = await getRedisClient().get(key);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        logger.warn(`Cache GET error [${key}]:`, err.message);
        return null;
    }
};

/**
 * Set a cached value with optional TTL (seconds).
 * @returns {boolean} true if set succeeded.
 */
export const cacheSet = async (key, value, ttl = DEFAULT_TTL) => {
    if (!isRedisConnected()) return false;
    try {
        await getRedisClient().set(key, JSON.stringify(value), "EX", ttl);
        return true;
    } catch (err) {
        logger.warn(`Cache SET error [${key}]:`, err.message);
        return false;
    }
};

/**
 * Delete a single cached key.
 */
export const cacheDel = async (key) => {
    if (!isRedisConnected()) return false;
    try {
        await getRedisClient().del(key);
        return true;
    } catch (err) {
        logger.warn(`Cache DEL error [${key}]:`, err.message);
        return false;
    }
};

/**
 * Delete all keys matching a glob pattern (e.g. "medicines:*").
 * Uses SCAN to avoid blocking Redis on large keyspaces.
 */
export const cacheDelPattern = async (pattern) => {
    if (!isRedisConnected()) return false;
    try {
        const redis = getRedisClient();
        let cursor = "0";
        do {
            const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
            cursor = nextCursor;
            if (keys.length > 0) {
                await redis.del(...keys);
            }
        } while (cursor !== "0");
        return true;
    } catch (err) {
        logger.warn(`Cache DEL pattern error [${pattern}]:`, err.message);
        return false;
    }
};
