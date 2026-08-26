import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api, registerAuthTokenProvider } from './api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole;
  isLoading: boolean;
  signInWithDemo: (role: 'admin' | 'user') => Promise<void>;
  signInWithCustomToken: (token: string, email: string, name?: string) => Promise<void>;
  signOut: () => void;
  updateUserContext: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('geoissue_token')
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Register token provider with API client
  useEffect(() => {
    registerAuthTokenProvider(async () => {
      return localStorage.getItem('geoissue_token');
    });
  }, []);

  // Fetch current user whenever token changes or on mount
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const profile = await api.getMe();
        setUser(profile);
      } catch (err) {
        console.warn('Failed to load user profile with current token:', err);
        // Token invalid or expired
        localStorage.removeItem('geoissue_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, [token]);

  const signInWithCustomToken = async (
    authToken: string,
    email: string,
    displayName?: string
  ) => {
    setIsLoading(true);
    try {
      localStorage.setItem('geoissue_token', authToken);
      setToken(authToken);

      // Perform /api/me/sync
      const syncedUser = await api.syncMe({
        firebase_uid: authToken.startsWith('mock:')
          ? authToken.replace('mock:', '')
          : `uid_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email,
        display_name: displayName || email.split('@')[0],
      });

      setUser(syncedUser);
    } catch (err) {
      console.error('Sign-in error:', err);
      localStorage.removeItem('geoissue_token');
      setToken(null);
      setUser(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithDemo = async (role: 'admin' | 'user') => {
    const demoToken = role === 'admin' ? 'dev-admin' : 'dev-user';
    const demoEmail = role === 'admin' ? 'admin@geoissue.org' : 'citizen@geoissue.org';
    const demoName = role === 'admin' ? 'Lead Admin' : 'Tariq Al-Mansoor';
    await signInWithCustomToken(demoToken, demoEmail, demoName);
  };

  const signOut = () => {
    localStorage.removeItem('geoissue_token');
    setToken(null);
    setUser(null);
  };

  const updateUserContext = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const role: UserRole = user ? user.role : 'visitor';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isLoading,
        signInWithDemo,
        signInWithCustomToken,
        signOut,
        updateUserContext,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
