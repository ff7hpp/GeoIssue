import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, registerAuthTokenProvider } from "./api";
import {
  auth as fbAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  googleProvider,
  updateProfile,
  fbSignOut,
  onAuthStateChanged
} from "./firebase";
const AuthContext = createContext(void 0);
const firebaseFallbackCodes = /* @__PURE__ */ new Set([
  "auth/invalid-credential",
  "auth/user-not-found",
  "auth/operation-not-allowed",
  "auth/configuration-not-found"
]);
function canUseNativeAuthFallback(error) {
  return typeof error === "object" && error !== null && "code" in error && firebaseFallbackCodes.has(String(error.code));
}
const AuthProvider = ({
  children
}) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    localStorage.getItem("geoissue_token")
  );
  const [isLoading, setIsLoading] = useState(true);
  const authOperation = useRef(false);
  const authRevision = useRef(0);
  useEffect(() => {
    registerAuthTokenProvider(async () => {
      const revision = authRevision.current;
      if (fbAuth.currentUser) {
        try {
          const freshToken = await fbAuth.currentUser.getIdToken();
          if (revision !== authRevision.current) return null;
          localStorage.setItem("geoissue_token", freshToken);
          return freshToken;
        } catch {
        }
      }
      return localStorage.getItem("geoissue_token");
    });
  }, []);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(fbAuth, async (fbUser) => {
      if (authOperation.current) return;
      const revision = authRevision.current;
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          if (revision !== authRevision.current) return;
          localStorage.setItem("geoissue_token", idToken);
          setToken(idToken);
          const syncedUser = await api.syncMe({
            display_name: fbUser.displayName || "Citizen"
          });
          if (revision === authRevision.current) setUser(syncedUser);
        } catch (err) {
          if (revision !== authRevision.current) return;
          console.warn("Firebase auth sync warning:", err);
          localStorage.removeItem("geoissue_token");
          setToken(null);
          setUser(null);
          await fbSignOut(fbAuth).catch(() => void 0);
        } finally {
          setIsLoading(false);
        }
      } else {
        const savedToken = localStorage.getItem("geoissue_token");
        if (savedToken && !savedToken.startsWith("eyJ")) {
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
  async function loadUserProfile(authToken) {
    const revision = authRevision.current;
    try {
      const profile = await api.getMe();
      if (revision === authRevision.current) setUser(profile);
    } catch (err) {
      if (revision !== authRevision.current) return;
      console.warn("Failed to load user profile with current token:", err);
      localStorage.removeItem("geoissue_token");
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }
  const signInWithEmail = async (email, password) => {
    authRevision.current++;
    authOperation.current = true;
    setIsLoading(true);
    try {
      try {
        const userCredential = await signInWithEmailAndPassword(fbAuth, email, password);
        const idToken = await userCredential.user.getIdToken();
        localStorage.setItem("geoissue_token", idToken);
        setToken(idToken);
        const synced = await api.syncMe({
          display_name: userCredential.user.displayName || email.split("@")[0]
        });
        setUser(synced);
        return;
      } catch (fbErr) {
        if (canUseNativeAuthFallback(fbErr)) {
          await fbSignOut(fbAuth).catch(() => void 0);
          const result = await api.login({ email, password });
          localStorage.setItem("geoissue_token", result.token);
          setToken(result.token);
          setUser(result.user);
          return;
        }
        throw fbErr;
      }
    } catch (err) {
      console.warn("Email sign-in failed:", err);
      localStorage.removeItem("geoissue_token");
      setToken(null);
      setUser(null);
      await fbSignOut(fbAuth).catch(() => void 0);
      throw err;
    } finally {
      authOperation.current = false;
      setIsLoading(false);
    }
  };
  const registerWithEmail = async (email, password, displayName, language = "en") => {
    authRevision.current++;
    authOperation.current = true;
    setIsLoading(true);
    try {
      let userCredential;
      try {
        userCredential = await createUserWithEmailAndPassword(fbAuth, email, password);
      } catch (fbErr) {
        if (!canUseNativeAuthFallback(fbErr)) throw fbErr;
        const result = await api.register({
          email,
          password,
          display_name: displayName,
          language
        });
        localStorage.setItem("geoissue_token", result.token);
        setToken(result.token);
        setUser(result.user);
        return;
      }
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
      const idToken = await userCredential.user.getIdToken();
      localStorage.setItem("geoissue_token", idToken);
      setToken(idToken);
      const synced = await api.syncMe({ display_name: displayName });
      setUser(synced);
    } catch (err) {
      console.warn("Registration failed:", err);
      localStorage.removeItem("geoissue_token");
      setToken(null);
      setUser(null);
      await fbSignOut(fbAuth).catch(() => void 0);
      throw err;
    } finally {
      authOperation.current = false;
      setIsLoading(false);
    }
  };
  const signInWithGoogle = async () => {
    authRevision.current++;
    authOperation.current = true;
    setIsLoading(true);
    try {
      const result = await signInWithPopup(fbAuth, googleProvider);
      const idToken = await result.user.getIdToken();
      localStorage.setItem("geoissue_token", idToken);
      setToken(idToken);
      const synced = await api.syncMe({
        display_name: result.user.displayName || "Citizen"
      });
      setUser(synced);
    } catch (err) {
      console.warn("Google sign-in failed:", err);
      localStorage.removeItem("geoissue_token");
      setToken(null);
      setUser(null);
      await fbSignOut(fbAuth).catch(() => void 0);
      throw err;
    } finally {
      authOperation.current = false;
      setIsLoading(false);
    }
  };
  const signInWithCustomToken = async (authToken, email, displayName) => {
    authRevision.current++;
    authOperation.current = true;
    setIsLoading(true);
    try {
      await fbSignOut(fbAuth);
      localStorage.setItem("geoissue_token", authToken);
      setToken(authToken);
      const syncedUser = await api.syncMe({
        display_name: displayName || email.split("@")[0]
      });
      setUser(syncedUser);
    } catch (err) {
      console.warn("Sign-in failed:", err);
      localStorage.removeItem("geoissue_token");
      setToken(null);
      setUser(null);
      throw err;
    } finally {
      authOperation.current = false;
      setIsLoading(false);
    }
  };
  const signInWithDemo = async (role2) => {
    const demoToken = role2 === "admin" ? "dev-admin" : "dev-user";
    const demoEmail = role2 === "admin" ? "admin@geoissue.org" : "citizen@geoissue.org";
    const demoName = role2 === "admin" ? "Lead Admin" : "Tariq Al-Mansoor";
    await signInWithCustomToken(demoToken, demoEmail, demoName);
  };
  const signOut = async () => {
    authRevision.current++;
    authOperation.current = true;
    await queryClient.cancelQueries();
    queryClient.clear();
    localStorage.removeItem("geoissue_token");
    setToken(null);
    setUser(null);
    try {
      await fbSignOut(fbAuth);
    } catch {
    } finally {
      authOperation.current = false;
      localStorage.removeItem("geoissue_token");
      setToken(null);
      setUser(null);
    }
  };
  const updateUserContext = (updatedUser) => {
    setUser(updatedUser);
  };
  const role = user ? user.role : "visitor";
  return <AuthContext.Provider
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
      updateUserContext
    }}
  >
      {children}
    </AuthContext.Provider>;
};
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
export {
  AuthProvider,
  useAuth
};
