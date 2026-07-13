import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Automatically restore session on startup
  useEffect(() => {
    const restoreSession = async () => {
      if (token) {
        try {
          const response = await fetch('/api/auth/me', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          const data = await response.json();
          if (data.success) {
            setUser(data.user);
          } else {
            // Token expired or invalid
            logout();
          }
        } catch (error) {
          console.error('Session restoration error:', error);
          logout();
        }
      }
      setLoading(false);
    };

    restoreSession();
  }, [token]);

  // Login handler
  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Auth login error:', error);
      return { success: false, message: 'Server connection failed' };
    }
  };

  // Signup handler
  const signup = async (signupData) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(signupData)
      });

      const data = await response.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Auth signup error:', error);
      return { success: false, message: 'Server connection failed' };
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('currentView');
    setToken(null);
    setUser(null);
  };

  // Update profile handler
  const updateProfile = async (profileData) => {
    if (!token) return { success: false, message: 'Session expired' };

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();
      if (data.success) {
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Auth update error:', error);
      return { success: false, message: 'Profile update failed' };
    }
  };

  // Automated Bearer API request wrapper
  const apiFetch = async (url, options = {}) => {
    const headers = options.headers || {};
    
    // Automatically inject JWT Bearer token
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      
      // Auto logout on token authentication failures
      if (response.status === 401) {
        logout();
        throw new Error('Session expired');
      }

      return response;
    } catch (error) {
      console.error(`apiFetch failure [${url}]:`, error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, token, loading, login, signup, logout, updateProfile, apiFetch }}>
      {children}
    </AuthContext.Provider>
  );
};
