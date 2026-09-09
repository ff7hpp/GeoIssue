import { useState } from "react";
import { useAuth } from "../../services/auth.context";
import { errorMessage } from "../../services/errorMessage";
import { useTranslation } from "react-i18next";
import { X, Mail, Lock, User as UserIcon } from "lucide-react";
const AuthModal = ({
  isOpen,
  onClose,
  initialMode = "login"
}) => {
  const { signInWithEmail, registerWithEmail } = useAuth();
  const { t } = useTranslation();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  if (!isOpen) return null;
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (!email || !password) {
        throw new Error("Please provide email and password");
      }
      if (mode === "login") {
        await signInWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, displayName);
      }
      onClose();
    } catch (err) {
      setError(err?.code === "UNAUTHENTICATED" ? t("errors.credentials") : errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };
  return <div
    style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0, 0, 0, 0.65)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "var(--space-4)",
      zIndex: 5e3
    }}
    onClick={onClose}
  >
      <div
    className="card animate-fade-in"
    role="dialog"
    aria-modal="true"
    aria-label={mode === "login" ? t("auth.signInTitle") : t("auth.signUpTitle")}
    style={{
      width: "100%",
      maxWidth: "440px",
      maxHeight: "calc(100dvh - 32px)",
      overflowY: "auto",
      backgroundColor: "var(--bg-surface-elevated)",
      padding: "var(--space-6)",
      position: "relative",
      boxShadow: "var(--shadow-overlay)"
    }}
    onClick={(e) => e.stopPropagation()}
  >
        <button
    onClick={onClose}
    className="btn-icon"
    style={{ position: "absolute", top: "16px", insetInlineEnd: "16px" }}
    aria-label="Close modal"
  >
          <X size={20} />
        </button>

        <h2 style={{ fontSize: "1.4rem", fontWeight: 600, marginBottom: "4px" }}>
          {mode === "login" ? t("auth.signInTitle") : t("auth.signUpTitle")}
        </h2>
        <p style={{ fontSize: "0.875rem", marginBottom: "var(--space-6)", color: "var(--text-secondary)" }}>
          {mode === "login" ? t("auth.signInSubtitle") : t("auth.signUpSubtitle")}
        </p>

        {error && <div
    role="alert"
    style={{
      padding: "10px 14px",
      backgroundColor: "var(--status-rejected-bg)",
      color: "var(--status-rejected)",
      borderRadius: "var(--radius-md)",
      fontSize: "0.875rem",
      marginBottom: "var(--space-4)"
    }}
  >
            {error}
          </div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {mode === "register" && <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, marginBottom: "6px" }}>
                {t("auth.displayName")}
              </label>
              <div style={{ position: "relative" }}>
                <input
    type="text"
    required
    autoComplete="name"
    aria-label={t("auth.displayName")}
    value={displayName}
    onChange={(e) => setDisplayName(e.target.value)}
    placeholder="e.g. Layla Al-Hassan"
    style={{
      width: "100%",
      padding: "10px 12px",
      paddingInlineStart: "36px",
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--border-default)",
      backgroundColor: "var(--bg-surface)"
    }}
  />
                <UserIcon
    size={16}
    style={{
      position: "absolute",
      top: "50%",
      insetInlineStart: "12px",
      transform: "translateY(-50%)",
      color: "var(--text-tertiary)"
    }}
  />
              </div>
            </div>}

          <div>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, marginBottom: "6px" }}>
              {t("auth.email")}
            </label>
            <div style={{ position: "relative" }}>
              <input
    type="email"
    autoComplete="email"
    aria-label={t("auth.email")}
    required
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    placeholder="citizen@example.com"
    style={{
      width: "100%",
      padding: "10px 12px",
      paddingInlineStart: "36px",
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--border-default)",
      backgroundColor: "var(--bg-surface)"
    }}
  />
              <Mail
    size={16}
    style={{
      position: "absolute",
      top: "50%",
      insetInlineStart: "12px",
      transform: "translateY(-50%)",
      color: "var(--text-tertiary)"
    }}
  />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, marginBottom: "6px" }}>
              {t("auth.password")}
            </label>
            <div style={{ position: "relative" }}>
              <input
    type="password"
    minLength={mode === "register" ? 10 : void 0}
    autoComplete={mode === "register" ? "new-password" : "current-password"}
    aria-label={t("auth.password")}
    required
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    placeholder="••••••••"
    style={{
      width: "100%",
      padding: "10px 12px",
      paddingInlineStart: "36px",
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--border-default)",
      backgroundColor: "var(--bg-surface)"
    }}
  />
              <Lock
    size={16}
    style={{
      position: "absolute",
      top: "50%",
      insetInlineStart: "12px",
      transform: "translateY(-50%)",
      color: "var(--text-tertiary)"
    }}
  />
            </div>
          </div>

          <button
    type="submit"
    className="btn btn-primary"
    disabled={isSubmitting}
    style={{ width: "100%", padding: "12px", marginTop: "var(--space-2)" }}
  >
            {isSubmitting ? t("common.loading") : mode === "login" ? t("auth.signInButton") : t("auth.signUpButton")}
          </button>
        </form>

        <div style={{ marginTop: "var(--space-4)", textAlign: "center", fontSize: "0.875rem" }}>
          {mode === "login" ? <span>
              {t("auth.noAccount")}{" "}
              <button
    type="button"
    onClick={() => setMode("register")}
    style={{ color: "var(--accent-primary)", fontWeight: 600, textDecoration: "underline" }}
  >
                {t("auth.signUpButton")}
              </button>
            </span> : <span>
              {t("auth.haveAccount")}{" "}
              <button
    type="button"
    onClick={() => setMode("login")}
    style={{ color: "var(--accent-primary)", fontWeight: 600, textDecoration: "underline" }}
  >
                {t("auth.signInButton")}
              </button>
            </span>}
        </div>
      </div>
    </div>;
};
export {
  AuthModal
};
