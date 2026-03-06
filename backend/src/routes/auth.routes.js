const express = require('express');
const router = express.Router();
const authService = require('../services/auth.service');
const userRepo = require('../repositories/user.repository');
const { requireAuth } = require('../middleware/auth');

const IS_PROD = process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: IS_PROD ? 'none' : 'lax',
  secure: IS_PROD,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticação e gestão de conta
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Cadastrar novo usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nick, email, password]
 *             properties:
 *               nick:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 20
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       201:
 *         description: Usuário criado. Cookie vcm_token definido.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Dados inválidos ou nick/e-mail já em uso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', async (req, res) => {
  try {
    const { nick, email, password } = req.body;
    const { user, token } = await authService.register({ nick, email, password });
    res.cookie('vcm_token', token, COOKIE_OPTIONS);
    res.status(201).json({ user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Entrar com e-mail ou nickname
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [login, password]
 *             properties:
 *               login:
 *                 type: string
 *                 description: E-mail ou nickname
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login realizado. Cookie vcm_token definido.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Credenciais inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    const { user, token } = await authService.login({ login, password });
    res.cookie('vcm_token', token, COOKIE_OPTIONS);
    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Encerrar sessão
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Sessão encerrada. Cookie removido.
 */
router.post('/logout', requireAuth, (req, res) => {
  res.clearCookie('vcm_token', { httpOnly: true, sameSite: IS_PROD ? 'none' : 'lax', secure: IS_PROD });
  res.json({ message: 'Logout realizado com sucesso' });
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Retornar usuário autenticado
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário logado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Não autenticado
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await userRepo.findById(req.user.id);
    if (!user) return res.status(401).json({ error: 'Usuário não encontrado. Faça login novamente.' });
    res.json({ user: { id: user._id, nick: user.nick, email: user.email, email_verified: user.email_verified ?? undefined } });
  } catch {
    res.status(500).json({ error: 'Erro ao verificar sessão.' });
  }
});

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Solicitar link de redefinição de senha
 *     description: Sempre retorna sucesso para não expor quais e-mails estão cadastrados.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Resposta enviada (independente de o e-mail existir)
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'E-mail é obrigatório' });
    await authService.forgotPassword(email);
    res.json({ message: 'Se este e-mail estiver cadastrado, você receberá um link de redefinição.' });
  } catch (err) {
    console.error('[forgot-password]', err.message);
    res.status(500).json({ error: 'Erro ao processar solicitação' });
  }
});

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Redefinir senha com token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, token, newPassword]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               token:
 *                 type: string
 *                 description: Token recebido por e-mail
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Senha atualizada com sucesso
 *       400:
 *         description: Token inválido ou expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    await authService.resetPassword({ email, token, newPassword });
    res.json({ message: 'Senha atualizada com sucesso. Faça login com sua nova senha.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/verify-email', async (req, res) => {
  try {
    const { email, token } = req.body;
    if (!email || !token) return res.status(400).json({ error: 'email e token são obrigatórios' });
    await authService.verifyEmail({ email, token });
    res.json({ message: 'E-mail verificado com sucesso!' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/resend-verification', requireAuth, async (req, res) => {
  try {
    await authService.resendVerification(req.user.id);
    res.json({ message: 'E-mail de verificação reenviado.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
