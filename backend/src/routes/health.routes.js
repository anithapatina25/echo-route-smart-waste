/**
 * ECHO ROUTE SMART WASTE
 * Health & Diagnostics Routes (Public)
 */
const express = require('express');
const router = express.Router();
const HealthController = require('../controllers/health.controller');

router.get('/', HealthController.check);

module.exports = router;
