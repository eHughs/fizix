"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "dark" | "light";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("trader-analytics-theme") as Theme | null;
    const preferred = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    const next = stored === "light" || stored === "dark" ? stored : preferred;
    setTheme(next);
    applyTheme(next);
    setMounted(true);
  }, []);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    window.localStorage.setItem("trader-analytics-theme", next);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={mounted && theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={mounted && theme === "dark" ? "Light mode" : "Dark mode"}
      className="grid h-10 w-10 place-items-center rounded-xl border border-slate-800 bg-slate-950 text-slate-400 transition hover:border-amber-500/30 hover:text-amber-400"
    >
      {mounted && theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
    </button>
  );
}
