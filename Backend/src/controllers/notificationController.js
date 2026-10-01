import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearUserNotifications,
} from "../services/notificationService.js";

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await getUserNotifications(userId, true);

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch notifications",
    });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const notifications = await markNotificationAsRead(userId, id);

    return res.status(200).json({
      success: true,
      data: {
        notifications,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to mark notification as read",
    });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await markAllNotificationsAsRead(userId);

    return res.status(200).json({
      success: true,
      data: {
        notifications,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to mark all notifications as read",
    });
  }
};

export const clearNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    await clearUserNotifications(userId);

    return res.status(200).json({
      success: true,
      message: "Notifications cleared successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to clear notifications",
    });
  }
};
