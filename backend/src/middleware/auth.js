const { verifyToken } = require('../config/jwt');

function requireAuth(req, res, next) {
  const token = req.cookies?.vcm_token;
  if (!token) {
    return res.status(401).json({ error: 'Não autenticado. Faça login para continuar.' });
  }
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
  }
}

module.exports = { requireAuth };
