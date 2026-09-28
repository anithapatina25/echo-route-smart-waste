/**
 * ECHO ROUTE SMART WASTE
 * Notification Routes (Protected: All Authenticated Roles)
 */
const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notification.controller');
const { requireAuth } = require('../middleware/auth.middleware');

// All notification operations require authentication
router.use(requireAuth);

// 1. Get user notifications (supports ?unreadOnly=true and ?limit=50)
router.get('/', NotificationController.getNotifications);

// 2. Get unread notification count
router.get('/unread-count', NotificationController.getUnreadCount);

// 3. Mark single notification as read
router.patch('/:id/read', NotificationController.markRead);

// 4. Mark all unread notifications as read
router.patch('/read-all', NotificationController.markAllRead);

// 5. Delete notification
router.delete('/:id', NotificationController.deleteNotification);

module.exports = router;
