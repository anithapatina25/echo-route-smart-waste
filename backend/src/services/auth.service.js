/**
 * ECHO ROUTE SMART WASTE
 * Authentication Service
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');
const CitizenModel = require('../models/citizen.model');
const NotificationModel = require('../models/notification.model');
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

  registerCitizen: async ({ email, password, fullName, phone, wardNumber, villageName, houseNumber, landmark }) => {
    if (!email || !email.trim()) {
      throw ApiError.badRequest('Email address is required.');
    }
    if (!password || !password.trim()) {
      throw ApiError.badRequest('Password is required.');
    }
    if (!fullName || !fullName.trim()) {
      throw ApiError.badRequest('Full Name is required.');
    }
    if (password.length < 4) {
      throw ApiError.badRequest('Password must be at least 4 characters.');
    }

    const trimmedEmail = email.trim().toLowerCase();
    const existingUser = UserModel.findByEmail(trimmedEmail);
    if (existingUser) {
      throw ApiError.badRequest('An account with this email address already exists.');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = UserModel.create({
      email: trimmedEmail,
      passwordHash,
      role: 'CITIZEN',
      fullName: fullName.trim(),
      phone: phone ? phone.trim() : ''
    });

    CitizenModel.createProfile({
      userId: newUser.id,
      wardNumber: wardNumber ? wardNumber.trim() : 'Ward 4',
      villageName: villageName ? villageName.trim() : 'Gram Panchayat',
      houseNumber: houseNumber ? houseNumber.trim() : '',
      landmark: landmark ? landmark.trim() : ''
    });

    // Send welcome notification
    NotificationModel.createNotification({
      userId: newUser.id,
      title: 'Welcome to Echo Route!',
      message: `Account created successfully for ${newUser.full_name}. You can now schedule waste pickups and track collection status.`,
      type: 'SUCCESS',
      notificationType: 'SYSTEM'
    });

    // Issue JWT token
    const tokenPayload = {
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role
    };

    const token = jwt.sign(tokenPayload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn
    });

    const sanitizedUser = {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      fullName: newUser.full_name,
      phone: newUser.phone,
      createdAt: newUser.created_at
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
