"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

function getInitialDarkMode(): boolean {
  if (typeof window === "undefined") return false;
  const savedTheme = window.localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return savedTheme ? savedTheme === "dark" : prefersDark;
}

export default function ThemeToggle() {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [darkMode, setDarkMode] = useState<boolean>(getInitialDarkMode);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", darkMode);
    window.localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode, mounted]);

  // Render neutral placeholder until mounted so SSR and client markup match
  if (!mounted) {
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
