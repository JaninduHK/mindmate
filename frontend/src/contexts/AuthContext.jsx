import { createContext, useState, useEffect, useMemo } from 'react';
import { authAPI } from '../api/auth.api';
import { setAccessToken, clearAccessToken, getAccessToken } from '../api/axios.config';
import toast from 'react-hot-toast';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize - Check if user is logged in
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Ensure we have a usable access token on app load.
        // If missing/expired, try refresh (uses httpOnly refresh cookie).
        const hasToken = Boolean(getAccessToken());
        let meResponse;
        try {
          meResponse = await authAPI.getCurrentUser();
        } catch (err) {
          // If /me fails (commonly due to missing/expired access token),
          // attempt refresh once, then retry /me.
          const status = err?.response?.status;
          if (status === 401 || !hasToken) {
            const refreshRes = await authAPI.refreshToken();
            const newToken = refreshRes?.data?.accessToken;
            if (newToken) setAccessToken(newToken);
            meResponse = await authAPI.getCurrentUser();
          } else {
            throw err;
          }
        }

        if (meResponse?.success && meResponse?.data?.user) {
          setUser(meResponse.data.user);
          setIsAuthenticated(true);
          return;
        }

        setUser(null);
        setIsAuthenticated(false);
      } catch (error) {
        // User not authenticated, clear any stale data
        setUser(null);
        setIsAuthenticated(false);
        clearAccessToken();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Register function
  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      if (response.success) {
        setUser(response.data.user);
        setAccessToken(response.data.accessToken);
        setIsAuthenticated(true);
        toast.success(response.message || 'Registration successful!');
        return { success: true };
      }
      return { success: false, error: 'Registration failed' };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Register peer supporter
  const registerPeerSupporter = async (userData) => {
    try {
      const response = await authAPI.registerPeerSupporter(userData);
      if (response.success) {
        setUser(response.data.user);
        setAccessToken(response.data.accessToken);
        setIsAuthenticated(true);
        toast.success(response.message || 'Registration successful!');
        return { success: true };
      }
      return { success: false, error: 'Registration failed' };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Login function
  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      
      // Handle response - it could be nested as response.data or response
      const loginData = response.data || response;
      
      if (response.success || response.statusCode === 200) {
        const userData = loginData.user;
        const token = loginData.accessToken;
        
        // Validate we have required data
        if (!userData || !token) {
          throw new Error('Invalid response from server - missing user or token data');
        }
        
        setUser(userData);
        setAccessToken(token);
        setIsAuthenticated(true);
        toast.success(response.message || 'Login successful!');
        return { success: true, user: userData };
      }
      return { success: false, error: 'Login failed' };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
      setIsAuthenticated(false);
      clearAccessToken();
      toast.success('Logged out successfully');
    } catch (error) {
      // Even if logout fails on server, clear local state
      setUser(null);
      setIsAuthenticated(false);
      clearAccessToken();
      console.error('Logout error:', error);
    }
  };

  // Update user data
  const updateUser = (userData) => {
    setUser((prev) => ({ ...prev, ...userData }));
  };

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated,
    register,
    registerPeerSupporter,
    login,
    logout,
    updateUser,
  }), [user, loading, isAuthenticated]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
