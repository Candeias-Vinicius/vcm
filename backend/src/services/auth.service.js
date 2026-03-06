const bcrypt = require('bcrypt');
const userRepo = require('../repositories/user.repository');
const emailService = require('./email.service');
const { generateToken } = require('../config/jwt');

function serializeUser(user) {
  return { id: user._id, nick: user.nick, email: user.email, email_verified: user.email_verified ?? undefined };
}

async function register({ nick, email, password }) {
  if (!nick || !email || !password) throw new Error('nick, email e senha são obrigatórios');
  if (password.length < 6) throw new Error('A senha deve ter no mínimo 6 caracteres');

  const duplicate = await userRepo.findDuplicate(email, nick);
  if (duplicate) {
    if (duplicate.email === email.toLowerCase()) throw new Error('E-mail já cadastrado');
    throw new Error('Nickname já em uso');
  }

  const password_hash = await bcrypt.hash(password, 10);
  const user = await userRepo.create({ nick, email, password_hash });

  // Send verification email (non-blocking — don't fail register if email fails)
  try {
    const rawToken = await user.initiateEmailVerification();
    await userRepo.save(user);
    await emailService.sendEmailVerification({ email: user.email, token: rawToken });
  } catch (err) {
    console.error('[register] Falha ao enviar email de verificação:', err.message);
  }

  const token = generateToken(user);
  return { user: serializeUser(user), token };
}

async function login({ login, password }) {
  if (!login || !password) throw new Error('E-mail/nickname e senha são obrigatórios');

  const user = await userRepo.findByLoginInput(login);
  if (!user) throw new Error('Credenciais inválidas');

  const valid = await user.checkPassword(password);
  if (!valid) throw new Error('Credenciais inválidas');

  const token = generateToken(user);
  return { user: serializeUser(user), token };
}

async function forgotPassword(email) {
  const user = await userRepo.findByEmail(email);
  if (!user) return;

  const rawToken = await user.initiatePasswordReset();
  await userRepo.save(user);

  await emailService.sendPasswordReset({ email, token: rawToken });
}

async function resetPassword({ email, token, newPassword }) {
  if (!email || !token || !newPassword) throw new Error('Dados incompletos');
  if (newPassword.length < 6) throw new Error('A senha deve ter no mínimo 6 caracteres');

  const user = await userRepo.findByEmail(email);
  if (!user) throw new Error('Token inválido ou expirado');

  await user.completePasswordReset(token, newPassword);
  await userRepo.save(user);
}

async function verifyEmail({ email, token }) {
  if (!email || !token) throw new Error('Dados incompletos');

  const user = await userRepo.findByEmail(email);
  if (!user) throw new Error('Token inválido');

  await user.verifyEmailToken(token);
  await userRepo.save(user);
}

async function resendVerification(userId) {
  const user = await userRepo.findById(userId);
  if (!user) throw new Error('Usuário não encontrado');
  if (user.email_verified) throw new Error('E-mail já verificado');

  const rawToken = await user.initiateEmailVerification();
  await userRepo.save(user);
  await emailService.sendEmailVerification({ email: user.email, token: rawToken });
}

async function updateNick(userId, newNick) {
  if (!newNick || newNick.trim().length < 2) throw new Error('Nickname deve ter no mínimo 2 caracteres');
  if (newNick.trim().length > 20) throw new Error('Nickname deve ter no máximo 20 caracteres');

  const user = await userRepo.findById(userId);
  if (!user) throw new Error('Usuário não encontrado');
  if (!user.email_verified) throw new Error('Verifique seu e-mail antes de alterar o nickname');

  const existing = await userRepo.findByNick(newNick.trim());
  if (existing && existing._id.toString() !== userId) throw new Error('Nickname já em uso');

  user.nick = newNick.trim();
  await userRepo.save(user);
  return serializeUser(user);
}

async function updatePassword(userId, currentPassword, newPassword) {
  if (!currentPassword || !newPassword) throw new Error('Dados incompletos');
  if (newPassword.length < 6) throw new Error('A nova senha deve ter no mínimo 6 caracteres');

  const user = await userRepo.findById(userId);
  if (!user) throw new Error('Usuário não encontrado');
  if (!user.email_verified) throw new Error('Verifique seu e-mail antes de alterar a senha');

  const valid = await user.checkPassword(currentPassword);
  if (!valid) throw new Error('Senha atual incorreta');

  user.password_hash = await require('bcrypt').hash(newPassword, 10);
  await userRepo.save(user);
}

async function requestEmailChange(userId, newEmail) {
  if (!newEmail) throw new Error('Novo e-mail é obrigatório');

  const user = await userRepo.findById(userId);
  if (!user) throw new Error('Usuário não encontrado');
  if (!user.email_verified) throw new Error('Verifique seu e-mail atual antes de solicitar a troca');
  if (newEmail.toLowerCase().trim() === user.email) throw new Error('O novo e-mail é igual ao atual');

  const existing = await userRepo.findByEmail(newEmail);
  if (existing) throw new Error('E-mail já cadastrado');

  const rawToken = await user.initiateEmailChange(newEmail);
  await userRepo.save(user);
  await emailService.sendEmailChangeConfirmation({ email: newEmail, token: rawToken });
}

async function confirmEmailChange({ email, token }) {
  if (!email || !token) throw new Error('Dados incompletos');

  const user = await userRepo.findOne({ pending_email: email.toLowerCase().trim() });
  if (!user) throw new Error('Token inválido');

  await user.confirmEmailChangeToken(token);
  await userRepo.save(user);
}

module.exports = { register, login, forgotPassword, resetPassword, verifyEmail, resendVerification, updateNick, updatePassword, requestEmailChange, confirmEmailChange };
