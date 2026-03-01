import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // { id, nick, email }
  const [loading, setLoading] = useState(true); // carregando sessão inicial

  useEffect(() => {
    api.me()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(loginInput, password) {
    const { user } = await api.login(loginInput, password);
    setUser(user);
    return user;
  }

  async function register(nick, email, password) {
    const { user } = await api.register(nick, email, password);
    setUser(user);
    return user;
  }

  async function logout() {
    await api.logout().catch(() => {});
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
