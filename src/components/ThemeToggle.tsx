"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState<boolean | null>(null);

  // Read theme only on client after mount — avoids SSR hydration mismatch
  useEffect(() => {
    const savedTheme = window.localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDarkMode(savedTheme ? savedTheme === "dark" : prefersDark);
  }, []);

  useEffect(() => {
    if (darkMode === null) return;
    document.documentElement.classList.toggle("dark", darkMode);
    window.localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Render nothing until we know the theme (prevents flash + hydration mismatch)
  if (darkMode === null) {
    return (
      <button
        type="button"
        className="neo-button flex h-12 w-12 items-center justify-center bg-[var(--bg-panel)] text-2xl leading-none text-[var(--text-main)]"
        aria-label="Toggle theme"
        title="Toggle theme"
      >
        <span aria-hidden="true">&nbsp;</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setDarkMode((value) => !value)}
      className="neo-button flex h-12 w-12 items-center justify-center bg-[var(--bg-panel)] text-2xl leading-none text-[var(--text-main)]"
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      title={darkMode ? "Light mode" : "Dark mode"}
    >
      <span aria-hidden="true">{darkMode ? "\u2600" : "\u263E"}</span>
    </button>
  );
}
