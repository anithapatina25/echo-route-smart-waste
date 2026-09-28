/**
 * ECHO ROUTE SMART WASTE
 * Environment Configuration
 */
const path = require('node:path');
const fs = require('node:fs');

const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  try {
    if (typeof process.loadEnvFile === 'function') {
      process.loadEnvFile(envPath);
    } else {
      require('dotenv').config({ path: envPath });
    }
  } catch {
    require('dotenv').config({ path: envPath });
  }
}

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'echo_route_smart_waste_dev_secret_key_gram_panchayat_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
};

module.exports = config;
