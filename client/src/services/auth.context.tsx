import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api, registerAuthTokenProvider } from './api';
import {
  auth as fbAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  googleProvider,
  updateProfile,
  fbSignOut,
  onAuthStateChanged,
} from './firebase';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole;
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName: string, language?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithDemo: (role: 'admin' | 'user') => Promise<void>;
  signInWithCustomToken: (token: string, email: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
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
      // If user is signed in with Firebase, get fresh token
      if (fbAuth.currentUser) {
        try {
          const freshToken = await fbAuth.currentUser.getIdToken();
          localStorage.setItem('geoissue_token', freshToken);
          return freshToken;
        } catch {
          // Fall back to stored token
        }
      }
      return localStorage.getItem('geoissue_token');
    });
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(fbAuth, async (fbUser) => {
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          localStorage.setItem('geoissue_token', idToken);
          setToken(idToken);

          // Sync with local backend
          const syncedUser = await api.syncMe({
            firebase_uid: fbUser.uid,
            email: fbUser.email || `${fbUser.uid}@geoissue.org`,
            display_name: fbUser.displayName || 'Citizen',
          });
          setUser(syncedUser);
        } catch (err) {
          console.warn('Firebase auth sync warning:', err);
        } finally {
          setIsLoading(false);
        }
      } else {
        // If not in Firebase Auth, check if custom token exists in storage
        const savedToken = localStorage.getItem('geoissue_token');
        if (savedToken && !savedToken.startsWith('eyJ')) {
          // Custom / demo token
          loadUserProfile(savedToken);
        } else if (!savedToken) {
          setUser(null);
          setIsLoading(false);
        } else {
          loadUserProfile(savedToken);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  async function loadUserProfile(authToken: string) {
    try {
      const profile = await api.getMe();
      setUser(profile);
    } catch (err) {
      console.warn('Failed to load user profile with current token:', err);
      localStorage.removeItem('geoissue_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Try Firebase Auth first
      try {
        const userCredential = await signInWithEmailAndPassword(fbAuth, email, password);
        const idToken = await userCredential.user.getIdToken();
        localStorage.setItem('geoissue_token', idToken);
        setToken(idToken);
        const synced = await api.syncMe({
          firebase_uid: userCredential.user.uid,
          email: userCredential.user.email || email,
          display_name: userCredential.user.displayName || email.split('@')[0],
        });
        setUser(synced);
        return;
      } catch (fbErr: any) {
        // If Firebase Auth fails due to user-not-found, try backend API direct auth
        if (fbErr.code === 'auth/invalid-credential' || fbErr.code === 'auth/user-not-found') {
          const result = await api.login({ email, password });
          localStorage.setItem('geoissue_token', result.token);
          setToken(result.token);
          setUser(result.user);
          return;
        }
        throw fbErr;
      }
    } catch (err) {
      console.error('Email sign-in error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithEmail = async (
    email: string,
    password: string,
    displayName: string,
    language = 'en'
  ) => {
    setIsLoading(true);
    try {
      try {
        const userCredential = await createUserWithEmailAndPassword(fbAuth, email, password);
        if (displayName) {
          await updateProfile(userCredential.user, { displayName });
        }
        const idToken = await userCredential.user.getIdToken();
        localStorage.setItem('geoissue_token', idToken);
        setToken(idToken);
        const synced = await api.syncMe({
          firebase_uid: userCredential.user.uid,
          email: userCredential.user.email || email,
          display_name: displayName,
        });
        setUser(synced);
        return;
      } catch (fbErr: any) {
        // Fall back to direct backend registration
        const result = await api.register({
          email,
          password,
          display_name: displayName,
          language,
        });
        localStorage.setItem('geoissue_token', result.token);
        setToken(result.token);
        setUser(result.user);
      }
    } catch (err) {
      console.error('Registration error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(fbAuth, googleProvider);
      const idToken = await result.user.getIdToken();
      localStorage.setItem('geoissue_token', idToken);
      setToken(idToken);
      const synced = await api.syncMe({
        firebase_uid: result.user.uid,
        email: result.user.email || `${result.user.uid}@geoissue.org`,
        display_name: result.user.displayName || 'Citizen',
      });
      setUser(synced);
    } catch (err) {
      console.error('Google sign-in error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithCustomToken = async (
    authToken: string,
    email: string,
    displayName?: string
  ) => {
    setIsLoading(true);
    try {
      localStorage.setItem('geoissue_token', authToken);
      setToken(authToken);

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

  const signOut = async () => {
    try {
      await fbSignOut(fbAuth);
    } catch {
      // ignore
    }
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
        signInWithEmail,
        registerWithEmail,
        signInWithGoogle,
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
