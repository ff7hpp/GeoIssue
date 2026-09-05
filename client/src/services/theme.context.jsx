import { createContext, useContext, useEffect, useState } from "react";
const ThemeContext = createContext(void 0);
const ThemeProvider = ({
  children
}) => {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem("geoissue_theme") || "system";
  });
  const [resolvedTheme, setResolvedTheme] = useState("light");
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      let activeTheme = "light";
      if (theme === "system") {
        activeTheme = mediaQuery.matches ? "dark" : "light";
      } else {
        activeTheme = theme;
      }
      setResolvedTheme(activeTheme);
      root.setAttribute("data-theme", activeTheme);
    };
    applyTheme();
    const listener = () => {
      if (theme === "system") applyTheme();
    };
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, [theme]);
  const setTheme = (newTheme) => {
    localStorage.setItem("geoissue_theme", newTheme);
    setThemeState(newTheme);
  };
  return <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>;
};
function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
export {
  ThemeProvider,
  useTheme
};
