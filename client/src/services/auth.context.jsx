import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, registerAuthTokenProvider } from "./api";

const AuthContext = createContext(undefined);
const TOKEN_STORAGE_KEY = "geoissue_token";

const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [isLoading, setIsLoading] = useState(true);
  const authRevision = useRef(0);

  const clearSession = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  };

  const applySession = (session) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, session.token);
    setToken(session.token);
    setUser(session.user);
  };

  useEffect(() => {
    registerAuthTokenProvider(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const revision = authRevision.current;

    if (!savedToken) {
      setIsLoading(false);
      return;
    }

    api.getMe()
      .then((profile) => {
        if (revision === authRevision.current) setUser(profile);
      })
      .catch(() => {
        if (revision === authRevision.current) clearSession();
      })
      .finally(() => {
        if (revision === authRevision.current) setIsLoading(false);
      });
  }, []);

  const runAuthRequest = async (request) => {
    const revision = ++authRevision.current;
    setIsLoading(true);
    try {
      const session = await request();
      if (revision === authRevision.current) applySession(session);
    } catch (error) {
      if (revision === authRevision.current) clearSession();
      throw error;
    } finally {
      if (revision === authRevision.current) setIsLoading(false);
    }
  };

  const signInWithEmail = (email, password) => runAuthRequest(
    () => api.login({ email, password })
  );

  const registerWithEmail = (email, password, displayName, language = "en") => runAuthRequest(
    () => api.register({
      email,
      password,
      display_name: displayName,
      language
    })
  );

  const signOut = async () => {
    authRevision.current += 1;
    await queryClient.cancelQueries();
    queryClient.clear();
    clearSession();
    setIsLoading(false);
  };

  const role = user?.role || "visitor";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isLoading,
        signInWithEmail,
        registerWithEmail,
        signOut,
        updateUserContext: setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export { AuthProvider, useAuth };
