/**
 * ECHO ROUTE SMART WASTE
 * JWT Authentication Middleware
 */
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const db = require('../../../database/client');
const { ApiError } = require('./error.middleware');

function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No authorization token provided. Please log in.');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw ApiError.unauthorized('Malformed authorization header.');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        throw ApiError.unauthorized('Your session has expired. Please log in again.');
      }
      throw ApiError.unauthorized('Invalid authentication token.');
    }

    // Verify user still exists and is active in the dedicated database
    const user = db.get(
      'SELECT id, email, role, full_name, phone, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) {
      throw ApiError.unauthorized('User associated with token no longer exists.');
    }

    if (!user.is_active) {
      throw ApiError.forbidden('User account has been deactivated.');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireAuth };
