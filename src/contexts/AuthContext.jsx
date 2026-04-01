import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const API_BASE = import.meta.env.VITE_API_BASE || 'https://ims-backend-beta-eight.vercel.app';

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('ims_user');
    const storedToken = localStorage.getItem('ims_token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');

    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('ims_user', JSON.stringify(data.user));
    localStorage.setItem('ims_token', data.token);
    return data.user;
  };

  const register = async (userData) => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    return data;
  };

  const verifyUserEmail = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify/${userId}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Email verification failed');
      }

      if (user && user.id === userId) {
        const updated = { ...user, isVerified: true };
        setUser(updated);
        localStorage.setItem('ims_user', JSON.stringify(updated));
      }

      return data;
    } catch (error) {
      console.error('verifyUserEmail failed:', error);
      throw new Error(error.message || 'Email verification failed');
    }
  };

  const finalizeLogin = (userObj, tokenValue) => {
    const valueToken = tokenValue || localStorage.getItem('ims_token') || token;
    setUser(userObj);
    setToken(valueToken);
    localStorage.setItem('ims_user', JSON.stringify(userObj));
    if (valueToken) localStorage.setItem('ims_token', valueToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ims_user');
    localStorage.removeItem('ims_token');
    // keep ims_studentProfile to allow profile preview after logout
    window.location.href = '/login';
  };

  const value = {
    user,
    token,
    loading,
    login,
    verifyUserEmail,
    register,
    finalizeLogin,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
