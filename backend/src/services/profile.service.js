const userRepo = require('../repositories/user.repository');
const emailService = require('./email.service');

function serializeUser(user) {
  return {
    id: user._id,
    nick: user.nick,
    email: user.email,
    email_verified: user.email_verified ?? undefined,
    pending_email: user.pending_email ?? undefined,
  };
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

  await user.changePassword(currentPassword, newPassword);
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

  const user = await userRepo.findByPendingEmail(email);
  if (!user) throw new Error('Token inválido');

  await user.confirmEmailChangeToken(token);
  await userRepo.save(user);
}

module.exports = { updateNick, updatePassword, requestEmailChange, confirmEmailChange };
