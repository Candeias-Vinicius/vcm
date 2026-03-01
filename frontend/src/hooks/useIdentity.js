// Identidade do usuário — nick agora vem do AuthContext (JWT).
// Este arquivo mantido apenas por compatibilidade de imports legados.

// Limpa dados antigos do localStorage na migração para JWT
(function cleanup() {
  try {
    localStorage.removeItem('vcm_nickname');
    localStorage.removeItem('vcm_admin_tokens');
  } catch {}
})();
