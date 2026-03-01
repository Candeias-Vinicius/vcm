const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;

const userSchema = new mongoose.Schema(
  {
    nick: { type: String, required: true, unique: true, trim: true, minlength: 2, maxlength: 20 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    reset_token: { type: String, default: null },
    reset_token_expires: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.methods.hasValidResetToken = function () {
  return Boolean(
    this.reset_token &&
    this.reset_token_expires &&
    this.reset_token_expires > new Date()
  );
};

userSchema.methods.checkPassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password_hash);
};

userSchema.methods.initiatePasswordReset = async function () {
  const rawToken = uuidv4();
  this.reset_token = await bcrypt.hash(rawToken, 10);
  this.reset_token_expires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
  return rawToken;
};

userSchema.methods.completePasswordReset = async function (rawToken, newPassword) {
  if (!this.hasValidResetToken()) {
    throw new Error('Token inválido ou expirado');
  }

  const valid = await bcrypt.compare(rawToken, this.reset_token);
  if (!valid) throw new Error('Token inválido ou expirado');

  this.password_hash = await bcrypt.hash(newPassword, 10);
  this.reset_token = null;
  this.reset_token_expires = null;
};

module.exports = mongoose.model('User', userSchema);
