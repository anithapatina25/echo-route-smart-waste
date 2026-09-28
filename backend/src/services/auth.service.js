/**
 * ECHO ROUTE SMART WASTE
 * Authentication Service
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');
const config = require('../config/env');
const { ApiError } = require('../middleware/error.middleware');

const AuthService = {
  login: async ({ email, password, portalRole }) => {
    if (!email || !password) {
      throw ApiError.badRequest('Email and password are required.');
    }

    const user = UserModel.findByEmail(email);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    if (!user.is_active) {
      throw ApiError.forbidden('This account has been deactivated.');
    }

    // Compare bcrypt password hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    // Optional Portal Role Enforcement:
    // If the user selected a specific portal (e.g. Citizen Portal), ensure their account role matches
    if (portalRole && portalRole !== user.role) {
      throw ApiError.forbidden(
        `This account is registered as '${user.role}', but you are attempting to log into the '${portalRole}' portal. Please select the correct portal tab.`
      );
    }

    // Issue JWT token
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(tokenPayload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn
    });

    const sanitizedUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
      phone: user.phone,
      createdAt: user.created_at
    };

    return {
      token,
      user: sanitizedUser
    };
  },

  getCurrentUser: (userId) => {
    const user = UserModel.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
      phone: user.phone,
      createdAt: user.created_at
    };
  }
};

module.exports = AuthService;
