/**
 * ECHO ROUTE SMART WASTE
 * Auth Routes
 */
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.post('/login', AuthController.login);
router.get('/me', requireAuth, AuthController.me);
router.post('/logout', AuthController.logout);

module.exports = router;
