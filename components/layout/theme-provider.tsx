"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";
const THEME_COLOR: Record<Theme, string> = { light: "#f7f7f5", dark: "#191919" };

/** Script eseguito prima del primo disegno: evita il "flash" del tema sbagliato. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");if(t==="light"){document.documentElement.classList.remove("dark")}else{document.documentElement.classList.add("dark")}}catch(e){}})();`;

const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void; toggle: () => void }>({
  theme: "dark",
  setTheme: () => {},
  toggle: () => {},
});

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", THEME_COLOR[theme]));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Il valore reale si legge dopo il montaggio (lo script iniziale ha già messo la classe giusta).
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const initial: Theme = document.documentElement.classList.contains("dark") ? "dark" : "light";
    setThemeState(initial);
    applyTheme(initial);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    applyTheme(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* archiviazione non disponibile: il tema vale solo per questa sessione */
    }
  }, []);

  const toggle = useCallback(() => setTheme(theme === "dark" ? "light" : "dark"), [theme, setTheme]);

  return <ThemeContext.Provider value={{ theme, setTheme, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
