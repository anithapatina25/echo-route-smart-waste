/**
 * ECHO ROUTE SMART WASTE
 * Notification Controller
 */
const NotificationModel = require('../models/notification.model');
const { ApiError } = require('../middleware/error.middleware');

const NotificationController = {
  // 1. Get authenticated user's notifications
  getNotifications: (req, res, next) => {
    try {
      const notifications = NotificationModel.getUserNotifications(req.user.id, req.query);
      const unreadCount = NotificationModel.getUnreadCount(req.user.id);

      res.status(200).json({
        success: true,
        data: notifications,
        count: notifications.length,
        unreadCount
      });
    } catch (err) {
      next(err);
    }
  },

  // 2. Get unread notification count
  getUnreadCount: (req, res, next) => {
    try {
      const unreadCount = NotificationModel.getUnreadCount(req.user.id);
      res.status(200).json({
        success: true,
        count: unreadCount,
        unreadCount
      });
    } catch (err) {
      next(err);
    }
  },

  // 3. Mark single notification as read
  markRead: (req, res, next) => {
    try {
      const notificationId = parseInt(req.params.id, 10);
      if (isNaN(notificationId)) {
        throw ApiError.badRequest('Invalid notification ID parameter.');
      }

      const updated = NotificationModel.markAsRead(notificationId, req.user.id);
      const unreadCount = NotificationModel.getUnreadCount(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Notification marked as read.',
        data: updated,
        unreadCount
      });
    } catch (err) {
      next(err);
    }
  },

  // 4. Mark all unread notifications as read
  markAllRead: (req, res, next) => {
    try {
      const result = NotificationModel.markAllAsRead(req.user.id);

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read.',
        data: result,
        unreadCount: 0
      });
    } catch (err) {
      next(err);
    }
  },

  // 5. Delete a notification
  deleteNotification: (req, res, next) => {
    try {
      const notificationId = parseInt(req.params.id, 10);
      if (isNaN(notificationId)) {
        throw ApiError.badRequest('Invalid notification ID parameter.');
      }

      const result = NotificationModel.deleteNotification(notificationId, req.user.id);
      const unreadCount = NotificationModel.getUnreadCount(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Notification deleted.',
        data: result,
        unreadCount
      });
    } catch (err) {
      next(err);
    }
  },

  // 6. Admin System Activity Feed
  getAdminActivity: (req, res, next) => {
    try {
      if (req.user.role !== 'ADMIN') {
        throw ApiError.forbidden('Administrative privileges required to access system activity stream.');
      }

      const limit = req.query.limit || 15;
      const activities = NotificationModel.getRecentAdminActivity(limit);

      res.status(200).json({
        success: true,
        data: activities,
        count: activities.length
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = NotificationController;
