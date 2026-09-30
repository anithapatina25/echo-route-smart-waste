/**
 * ECHO ROUTE SMART WASTE
 * User Model
 */
const db = require('../../../database/client');

const UserModel = {
  findByEmail: (email) => {
    return db.get(
      'SELECT id, email, password_hash, role, full_name, phone, is_active, created_at FROM users WHERE LOWER(email) = LOWER(?)',
      [email.trim()]
    );
  },

  findById: (id) => {
    return db.get(
      'SELECT id, email, role, full_name, phone, is_active, created_at FROM users WHERE id = ?',
      [id]
    );
  },

  getAllByRole: (role) => {
    return db.query(
      'SELECT id, email, role, full_name, phone, is_active, created_at FROM users WHERE role = ? ORDER BY full_name ASC',
      [role]
    );
  },

  create: ({ email, passwordHash, role = 'CITIZEN', fullName, phone = '' }) => {
    db.run(
      `INSERT INTO users (email, password_hash, role, full_name, phone, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [email.trim().toLowerCase(), passwordHash, role, fullName.trim(), phone.trim()]
    );
    return db.get(
      'SELECT id, email, role, full_name, phone, is_active, created_at FROM users WHERE LOWER(email) = LOWER(?)',
      [email.trim()]
    );
  }
};

module.exports = UserModel;
