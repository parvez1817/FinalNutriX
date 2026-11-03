import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

const THEME_STORAGE_KEY = "nutrix:theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);
let transitionTimeout: number | undefined;

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("light", theme === "light");
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.classList.add("theme-changing");
  window.clearTimeout(transitionTimeout);
  transitionTimeout = window.setTimeout(() => {
    document.documentElement.classList.remove("theme-changing");
  }, 350);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    let storedTheme: string | null = null;
    try {
      storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      // Keep the default theme when browser storage is unavailable.
    }
    if (storedTheme === "light" || storedTheme === "dark") {
      setTheme(storedTheme);
      applyTheme(storedTheme);
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      const nextTheme = event.newValue === "light" ? "light" : "dark";
      setTheme(nextTheme);
      applyTheme(nextTheme);
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => {
        const nextTheme = theme === "dark" ? "light" : "dark";
        setTheme(nextTheme);
        applyTheme(nextTheme);
        try {
          window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
        } catch {
          // The selected theme remains active for the current page.
        }
      },
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// The shared hook lives beside its provider; it is not a Fast Refresh component.
// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}
