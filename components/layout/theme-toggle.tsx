"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";

/** Bottone per passare dal tema scuro a quello chiaro (e viceversa). */
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={isDark ? "Passa al tema chiaro" : "Passa al tema scuro"}
      title={isDark ? "Tema chiaro" : "Tema scuro"}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  );
}
