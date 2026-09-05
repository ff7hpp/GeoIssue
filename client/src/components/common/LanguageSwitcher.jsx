import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";
const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const languages = [
    { code: "en", label: "English", dir: "ltr" },
    { code: "ar", label: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629", dir: "rtl" },
    { code: "tr", label: "T\xFCrk\xE7e", dir: "ltr" }
  ];
  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };
  return <div className="relative" ref={dropdownRef} style={{ position: "relative" }}>
      <button
    onClick={() => setIsOpen(!isOpen)}
    className="btn-icon"
    title={t("language." + currentLang.code)}
    aria-label="Change language"
    style={{
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "6px 10px",
      border: "1px solid var(--border-default)",
      backgroundColor: "var(--bg-surface)"
    }}
  >
        <Globe size={16} />
        <span style={{ fontSize: "0.8125rem", fontWeight: 500 }}>
          {currentLang.label}
        </span>
      </button>

      {isOpen && <div
    style={{
      position: "absolute",
      top: "calc(100% + 6px)",
      insetInlineEnd: 0,
      backgroundColor: "var(--bg-surface-elevated)",
      border: "1px solid var(--border-default)",
      borderRadius: "var(--radius-md)",
      boxShadow: "var(--shadow-lg)",
      minWidth: "140px",
      zIndex: 2e3,
      overflow: "hidden",
      padding: "4px"
    }}
  >
          {languages.map((lang) => <button
    key={lang.code}
    onClick={() => changeLanguage(lang.code)}
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      padding: "8px 12px",
      fontSize: "0.875rem",
      borderRadius: "var(--radius-sm)",
      backgroundColor: i18n.language === lang.code ? "var(--accent-subtle)" : "transparent",
      color: i18n.language === lang.code ? "var(--accent-primary)" : "var(--text-primary)",
      fontWeight: i18n.language === lang.code ? 600 : 400,
      textAlign: "start"
    }}
  >
              <span>{lang.label}</span>
              {i18n.language === lang.code && <Check size={14} />}
            </button>)}
        </div>}
    </div>;
};
export {
  LanguageSwitcher
};
