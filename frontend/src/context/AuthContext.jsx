import { createContext, useContext, useEffect, useState } from 'react';
import { login as requestLogin, register as requestRegister } from '../api/auth.js';

const SESSION_KEY = 'bibliotech.session';
const AuthContext = createContext(null);

function readSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    return session?.token && session?.userId != null ? session : null;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession);

  useEffect(() => {
    const expireSession = () => {
      localStorage.removeItem(SESSION_KEY);
      setUser(null);
    };
    window.addEventListener('bibliotech:unauthorized', expireSession);
    return () => window.removeEventListener('bibliotech:unauthorized', expireSession);
  }, []);

  async function signIn(credentials) {
    const session = await requestLogin(credentials);
    if (!session.token || session.userId == null) throw new Error('The authentication service returned an incomplete session.');
    let email = credentials.email.trim();
    try {
      const payload = session.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      email = JSON.parse(atob(payload)).sub || email;
    } catch {
      // The credentials remain a display fallback; authorization uses the token and backend response.
    }
    const authenticatedUser = { ...session, email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(authenticatedUser));
    setUser(authenticatedUser);
    return authenticatedUser;
  }

  async function signUp(details) {
    const role = details.role === 'ADMIN' ? 'ADMIN' : 'USER';
    return requestRegister({ ...details, role });
  }

  function signOut() {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }

  function updateAccount(profile) {
    if (!user) return;
    const updated = { ...user, email: profile.email, name: profile.name };
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    setUser(updated);
  }

  return <AuthContext.Provider value={{ user, signIn, signUp, signOut, updateAccount }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}