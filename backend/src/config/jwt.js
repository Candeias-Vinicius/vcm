const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'vcm_dev_secret_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Gera um JWT assinado com os dados básicos do usuário.
 * @param {{ _id: any, nick: string, email: string }} user
 * @returns {string}
 */
function generateToken(user) {
  return jwt.sign(
    { id: user._id.toString(), nick: user.nick, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verifica e decodifica um JWT. Lança erro se inválido ou expirado.
 * @param {string} token
 * @returns {{ id: string, nick: string, email: string }}
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { JWT_SECRET, JWT_EXPIRES_IN, generateToken, verifyToken };
