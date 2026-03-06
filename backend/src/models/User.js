const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;          // 1 hour
const VERIFICATION_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

const userSchema = new mongoose.Schema(
  {
    nick: { type: String, required: true, unique: true, trim: true, minlength: 2, maxlength: 20 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    email_verified: { type: Boolean, default: false },
    verification_token: { type: String, default: null },
    verification_token_expires: { type: Date, default: null },
    reset_token: { type: String, default: null },
    reset_token_expires: { type: Date, default: null },
    pending_email: { type: String, default: null },
    email_change_token: { type: String, default: null },
    email_change_token_expires: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.methods.initiateEmailVerification = async function () {
  const rawToken = uuidv4();
  this.verification_token = await bcrypt.hash(rawToken, 10);
  this.verification_token_expires = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_MS);
  return rawToken;
};

userSchema.methods.verifyEmailToken = async function (rawToken) {
  if (!this.verification_token || !this.verification_token_expires) {
    throw new Error('Token inválido');
  }
  if (this.verification_token_expires < new Date()) {
    throw new Error('Link de verificação expirado. Solicite um novo.');
  }
  const valid = await bcrypt.compare(rawToken, this.verification_token);
  if (!valid) throw new Error('Token inválido');
  this.email_verified = true;
  this.verification_token = null;
  this.verification_token_expires = null;
};

userSchema.methods.initiateEmailChange = async function (newEmail) {
  const rawToken = uuidv4();
  this.pending_email = newEmail.toLowerCase().trim();
  this.email_change_token = await bcrypt.hash(rawToken, 10);
  this.email_change_token_expires = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_MS);
  return rawToken;
};

userSchema.methods.confirmEmailChangeToken = async function (rawToken) {
  if (!this.email_change_token || !this.email_change_token_expires || !this.pending_email) {
    throw new Error('Token inválido');
  }
  if (this.email_change_token_expires < new Date()) {
    throw new Error('Link de confirmação expirado. Solicite uma nova troca de email.');
  }
  const valid = await bcrypt.compare(rawToken, this.email_change_token);
  if (!valid) throw new Error('Token inválido');
  this.email = this.pending_email;
  this.pending_email = null;
  this.email_change_token = null;
  this.email_change_token_expires = null;
};


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
