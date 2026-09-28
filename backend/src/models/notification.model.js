/**
 * ECHO ROUTE SMART WASTE
 * Unified Notification Model
 */
const db = require('../../../database/client');
const { ApiError } = require('../middleware/error.middleware');

const NotificationModel = {
  // 1. Get user notifications with optional unread filter & pagination
  getUserNotifications: (userId, options = {}) => {
    const limit = Math.min(Math.max(parseInt(options.limit, 10) || 50, 1), 100);
    const unreadOnly = options.unreadOnly === true || options.unreadOnly === 'true';

    let sql = `
      SELECT n.id, n.user_id, n.title, n.message, n.type, 
             n.notification_type, n.related_pickup_id, n.action_url,
             n.is_read, n.read_at, n.created_at,
             pr.request_code, pr.waste_type, pr.ward_number, pr.status as pickup_status
      FROM notifications n
      LEFT JOIN pickup_requests pr ON n.related_pickup_id = pr.id
      WHERE n.user_id = ?
    `;
    const params = [userId];

    if (unreadOnly) {
      sql += ' AND n.is_read = 0';
    }

    sql += ' ORDER BY n.created_at DESC, n.id DESC LIMIT ?';
    params.push(limit);

    return db.query(sql, params).map(row => ({
      ...row,
      is_read: Boolean(row.is_read),
      notification_type: row.notification_type || 'GENERAL'
    }));
  },

  // 2. Fast unread notification count
  getUnreadCount: (userId) => {
    const row = db.get(
      'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    return row ? Number(row.unread_count) : 0;
  },

  // 3. Mark single notification as read with ownership validation
  markAsRead: (notificationId, userId) => {
    const notification = db.get('SELECT * FROM notifications WHERE id = ?', [notificationId]);
    if (!notification) {
      throw ApiError.notFound(`Notification #${notificationId} not found.`);
    }

    if (notification.user_id !== userId) {
      throw ApiError.forbidden("Access denied: You cannot modify another user's notification.");
    }

    if (!notification.is_read) {
      db.run(
        'UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE id = ?',
        [notificationId]
      );
    }

    const updated = db.get(
      `SELECT n.*, pr.request_code, pr.waste_type, pr.ward_number
       FROM notifications n
       LEFT JOIN pickup_requests pr ON n.related_pickup_id = pr.id
       WHERE n.id = ?`,
      [notificationId]
    );

    return {
      ...updated,
      is_read: true
    };
  },

  // 4. Mark all unread notifications as read for a user
  markAllAsRead: (userId) => {
    const beforeCount = NotificationModel.getUnreadCount(userId);
    if (beforeCount > 0) {
      db.run(
        'UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND is_read = 0',
        [userId]
      );
    }
    return {
      success: true,
      markedCount: beforeCount,
      unreadCount: 0
    };
  },

  // 5. Delete notification with ownership validation
  deleteNotification: (notificationId, userId) => {
    const notification = db.get('SELECT * FROM notifications WHERE id = ?', [notificationId]);
    if (!notification) {
      throw ApiError.notFound(`Notification #${notificationId} not found.`);
    }

    if (notification.user_id !== userId) {
      throw ApiError.forbidden("Access denied: You cannot delete another user's notification.");
    }

    db.run('DELETE FROM notifications WHERE id = ?', [notificationId]);

    return {
      success: true,
      deletedId: notificationId
    };
  },

  // 6. Central helper to dispatch a structured notification
  createNotification: ({
    userId,
    title,
    message,
    type = 'INFO',
    notificationType = 'GENERAL',
    relatedPickupId = null,
    actionUrl = null
  }) => {
    if (!userId || !title || !message) {
      throw new Error('userId, title, and message are required to dispatch notification.');
    }

    // Ensure type fits CHECK(type IN ('INFO', 'SUCCESS', 'WARNING', 'ALERT'))
    const validTypes = ['INFO', 'SUCCESS', 'WARNING', 'ALERT'];
    const safeType = validTypes.includes(type) ? type : 'INFO';

    db.run(
      `INSERT INTO notifications (user_id, title, message, type, notification_type, related_pickup_id, action_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, title, message, safeType, notificationType, relatedPickupId, actionUrl]
    );

    const created = db.get(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 1',
      [userId]
    );

    return {
      ...created,
      is_read: Boolean(created?.is_read)
    };
  },

  // 7. Recent System Activity for Admin Command Center
  getRecentAdminActivity: (limit = 15) => {
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 15, 1), 50);

    const rows = db.query(
      `SELECT n.id, n.title, n.message, n.type, n.notification_type, 
              n.related_pickup_id, n.created_at,
              pr.request_code, pr.waste_type, pr.ward_number, pr.status as pickup_status,
              u.full_name as user_name, u.role as user_role
       FROM notifications n
       JOIN users u ON n.user_id = u.id
       LEFT JOIN pickup_requests pr ON n.related_pickup_id = pr.id
       ORDER BY n.created_at DESC, n.id DESC
       LIMIT ?`,
      [safeLimit]
    );

    return rows.map(r => ({
      ...r,
      is_read: Boolean(r.is_read)
    }));
  }
};

module.exports = NotificationModel;
