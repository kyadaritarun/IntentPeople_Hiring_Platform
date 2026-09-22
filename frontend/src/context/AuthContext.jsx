import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('uptrix_token') || null);
  const [loading, setLoading] = useState(true);
  const [pendingOtpEmail, setPendingOtpEmail] = useState(null);

  useEffect(() => {
    if (token) {
      api.getMe()
        .then(userData => {
          setUser(userData);
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const loginUser = (access_token, userData) => {
    localStorage.setItem('uptrix_token', access_token);
    setToken(access_token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('uptrix_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const u = await api.getMe();
      setUser(u);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      pendingOtpEmail,
      setPendingOtpEmail,
      loginUser,
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
