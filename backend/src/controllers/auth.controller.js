/**
 * ECHO ROUTE SMART WASTE
 * Auth Controller
 */
const AuthService = require('../services/auth.service');

const AuthController = {
  login: async (req, res, next) => {
    try {
      const { email, password, portalRole } = req.body;
      const result = await AuthService.login({ email, password, portalRole });
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  register: async (req, res, next) => {
    try {
      const result = await AuthService.registerCitizen(req.body);
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  me: async (req, res, next) => {
    try {
      const user = AuthService.getCurrentUser(req.user.id);
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (err) {
      next(err);
    }
  },

  logout: async (req, res) => {
    // JWT is stateless; client removes token. Confirmation returned.
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  }
};

module.exports = AuthController;
