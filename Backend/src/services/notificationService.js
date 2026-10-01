import { safeGet, safeSet, safeDel, isRedisConnected } from "../config/redis.js";
import { emitToUser } from "../socket.js";
import Task from "../models/Task.js";

// In-memory fallback map when Redis is not available or offline
const inMemoryStore = new Map();

const NOTIF_PREFIX = "syncsprint:user:";
const NOTIF_SUFFIX = ":notifications";
const NOTIF_TTL = 7 * 24 * 60 * 60; // 7 days retention

const getRedisKey = (userId) => `${NOTIF_PREFIX}${userId}${NOTIF_SUFFIX}`;

/**
 * Creates a notification, persists it to Redis (or in-memory fallback),
 * and emits a real-time event via Socket.IO.
 */
export const createNotificationForUser = async (
  userId,
  { type = "TASK_ASSIGNED", message, task, taskId, projectId }
) => {
  if (!userId) return null;

  const targetTaskId = taskId || task?.id;
  const targetProjectId = projectId || task?.projectId;

  const newNotif = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type,
    message: message || "You have a new update",
    taskId: targetTaskId ? Number(targetTaskId) : undefined,
    projectId: targetProjectId ? Number(targetProjectId) : undefined,
    task: task
      ? {
          id: task.id,
          title: task.title,
          projectId: task.projectId,
          status: task.status,
          priority: task.priority,
        }
      : undefined,
    timestamp: Date.now(),
    read: false,
  };

  try {
    // Fetch current list
    const currentList = await getUserNotifications(userId, false);
    const updatedList = [newNotif, ...currentList.filter((n) => n.id !== newNotif.id)].slice(0, 50);

    // Save to Redis or in-memory
    if (isRedisConnected()) {
      await safeSet(getRedisKey(userId), updatedList, NOTIF_TTL);
    } else {
      inMemoryStore.set(String(userId), updatedList);
    }
  } catch (err) {
    console.warn(`[NotificationService] Error saving notification for user ${userId}:`, err.message);
  }

  // Emit real-time notification to user's WebSocket room
  try {
    emitToUser(userId, "notification:new", newNotif);
  } catch (socketErr) {
    console.warn(`[NotificationService] Error emitting socket notification:`, socketErr.message);
  }

  return newNotif;
};

/**
 * Retrieves notifications for a user.
 * If user has no notifications yet, automatically backfills from their assigned tasks.
 */
export const getUserNotifications = async (userId, autoBackfill = true) => {
  if (!userId) return [];

  let notifications = [];

  try {
    if (isRedisConnected()) {
      const cached = await safeGet(getRedisKey(userId));
      if (Array.isArray(cached)) {
        notifications = cached;
      } else if (typeof cached === "string") {
        try {
          notifications = JSON.parse(cached);
        } catch {
          notifications = [];
        }
      }
    } else {
      notifications = inMemoryStore.get(String(userId)) || [];
    }
  } catch (err) {
    console.warn(`[NotificationService] Error reading notifications:`, err.message);
    notifications = inMemoryStore.get(String(userId)) || [];
  }

  // If no notifications exist yet and autoBackfill is requested, backfill from assigned tasks
  if (autoBackfill && (!notifications || notifications.length === 0)) {
    try {
      const assignedTasks = await Task.findAll({
        where: { assignedTo: userId },
        order: [["updated_at", "DESC"]],
        limit: 10,
      });

      if (assignedTasks && assignedTasks.length > 0) {
        notifications = assignedTasks.map((t) => ({
          id: `backfill_task_${t.id}`,
          type: "TASK_ASSIGNED",
          message: `You are assigned to task: "${t.title}"`,
          taskId: t.id,
          projectId: t.projectId,
          task: {
            id: t.id,
            title: t.title,
            projectId: t.projectId,
            status: t.status,
            priority: t.priority,
          },
          timestamp: new Date(t.updatedAt || t.createdAt || Date.now()).getTime(),
          read: false,
        }));

        // Cache backfilled notifications
        if (isRedisConnected()) {
          await safeSet(getRedisKey(userId), notifications, NOTIF_TTL);
        } else {
          inMemoryStore.set(String(userId), notifications);
        }
      }
    } catch (dbErr) {
      console.warn(`[NotificationService] Error backfilling notifications from DB:`, dbErr.message);
    }
  }

  return notifications;
};

/**
 * Marks a single notification as read for a user.
 */
export const markNotificationAsRead = async (userId, notificationId) => {
  if (!userId || !notificationId) return [];

  const list = await getUserNotifications(userId, true);
  const updated = list.map((item) =>
    item.id === notificationId ? { ...item, read: true } : item
  );

  if (isRedisConnected()) {
    await safeSet(getRedisKey(userId), updated, NOTIF_TTL);
  } else {
    inMemoryStore.set(String(userId), updated);
  }

  return updated;
};

/**
 * Marks all notifications as read for a user.
 */
export const markAllNotificationsAsRead = async (userId) => {
  if (!userId) return [];

  const list = await getUserNotifications(userId, true);
  const updated = list.map((item) => ({ ...item, read: true }));

  if (isRedisConnected()) {
    await safeSet(getRedisKey(userId), updated, NOTIF_TTL);
  } else {
    inMemoryStore.set(String(userId), updated);
  }

  return updated;
};

/**
 * Clears all notifications for a user.
 */
export const clearUserNotifications = async (userId) => {
  if (!userId) return;

  if (isRedisConnected()) {
    await safeDel(getRedisKey(userId));
  }
  inMemoryStore.delete(String(userId));
};
