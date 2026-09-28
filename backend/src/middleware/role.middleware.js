/**
 * ECHO ROUTE SMART WASTE
 * Role-Based Access Control (RBAC) Guard Middleware
 */
const { ApiError } = require('./error.middleware');

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required before checking permissions.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. Role '${req.user.role}' is not authorized for this action. Required: ${allowedRoles.join(' or ')}.`
        )
      );
    }

    next();
  };
}

module.exports = { requireRole };
