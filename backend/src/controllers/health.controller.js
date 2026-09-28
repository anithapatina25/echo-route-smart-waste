/**
 * ECHO ROUTE SMART WASTE
 * Health Controller
 */
const db = require('../../../database/client');

const HealthController = {
  check: (req, res) => {
    try {
      const dbCheck = db.get('SELECT 1 as is_alive;');
      const userCount = db.get('SELECT COUNT(*) as count FROM users;').count;

      res.status(200).json({
        success: true,
        app: 'ECHO ROUTE SMART WASTE',
        tagline: 'Smarter Routes. Cleaner Communities.',
        status: 'OPERATIONAL',
        database: {
          status: dbCheck && dbCheck.is_alive === 1 ? 'CONNECTED' : 'UNKNOWN',
          type: 'SQLite (Node 24 Native ACID engine)',
          databaseFile: 'echo_route_smart_waste.db',
          registeredUsers: userCount
        },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        status: 'DEGRADED',
        error: err.message,
        timestamp: new Date().toISOString()
      });
    }
  }
};

module.exports = HealthController;
