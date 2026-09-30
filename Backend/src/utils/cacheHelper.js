import { safeGet, safeSet, safeDel, safeDelPattern, isRedisConnected } from "../config/redis.js";

/**
 * Standardized Redis cache keys across domains.
 */
export const cacheKeys = {
  userProfile: (userId) => `syncsprint:user:${userId}:profile`,
  allUsers: () => "syncsprint:users:all",
  teamMember: (teamId, userId) => `syncsprint:team:${teamId}:member:${userId}`,
  projectMeta: (projectId) => `syncsprint:project:${projectId}:meta`,
  sprintTasks: (sprintId) => `syncsprint:sprint:${sprintId}:tasks`,
  projectTasksPattern: (projectId) => `syncsprint:project:${projectId}:*`,
  sprintTasksPattern: (sprintId) => `syncsprint:sprint:${sprintId}:*`,
};

/**
 * Standard TTL durations in seconds.
 */
export const TTL = {
  SHORT: 60, // 1 minute (for volatile lists)
  MEDIUM: 300, // 5 minutes (for board tasks, sprint tasks)
  LONG: 900, // 15 minutes (for user profiles, memberships)
  DAY: 86400, // 24 hours
};

/**
 * Get an item from cache.
 * Returns null if not found or Redis is offline.
 */
export const cacheGet = async (key) => {
  return await safeGet(key);
};

/**
 * Set an item in cache with a TTL (seconds).
 */
export const cacheSet = async (key, value, ttlSeconds = TTL.MEDIUM) => {
  return await safeSet(key, value, ttlSeconds);
};

/**
 * Delete one or more keys from cache.
 */
export const cacheDel = async (...keys) => {
  return await safeDel(...keys);
};

/**
 * Delete all keys matching a pattern.
 */
export const cacheDelPattern = async (pattern) => {
  return await safeDelPattern(pattern);
};

export { isRedisConnected };
