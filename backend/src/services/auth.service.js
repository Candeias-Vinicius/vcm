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

module.exports = { register, login, forgotPassword, resetPassword, verifyEmail, resendVerification };
