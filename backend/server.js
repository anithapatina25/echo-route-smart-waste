/**
 * ECHO ROUTE SMART WASTE
 * Backend HTTP Server Entry Point
 */
const app = require('./src/app');
const config = require('./src/config/env');
const db = require('../database/client');

const server = app.listen(config.port, () => {
  console.log('====================================================');
  console.log('  ECHO ROUTE SMART WASTE - BACKEND API SERVER');
  console.log('  "Smarter Routes. Cleaner Communities."');
  console.log('====================================================');
  console.log(`  * Status:      ONLINE`);
  console.log(`  * Port:        ${config.port}`);
  console.log(`  * Environment: ${config.nodeEnv}`);
  console.log(`  * Database:    ${db.getDbPath()}`);
  console.log(`  * Health Check: http://localhost:${config.port}/api/health`);
  console.log('====================================================');
});

// Graceful shutdown handling
const shutdown = () => {
  console.log('\n[ECHO ROUTE] Gracefully stopping server...');
  server.close(() => {
    console.log('[ECHO ROUTE] Server shut down cleanly.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = server;
