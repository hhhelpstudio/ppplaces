// Theme toggle. An inline script in index.html <head> already applied any
// stored choice before first paint (no flash of the wrong theme); this keeps
// the button in sync, exposes the resolved theme to code that can't read CSS
// (map tiles), and follows the system setting when the user hasn't chosen.

import { qs } from "../core/dom.js";
import { icon } from "./icons.js";

const THEME_KEY = "pp-theme";
const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

/** @returns {"light" | "dark"} */
export function effectiveTheme() {
  let stored = null;
  try {
    stored = localStorage.getItem(THEME_KEY);
  } catch {
    /* storage blocked */
  }
  if (stored === "light" || stored === "dark") return stored;
  return systemDark.matches ? "dark" : "light";
}

function sync() {
  const theme = effectiveTheme();
  document.documentElement.dataset.resolvedTheme = theme;
  const btn = qs("theme-toggle");
  const isDark = theme === "dark";
  btn.innerHTML = icon(isDark ? "sun" : "moon", { size: 18 });
  btn.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  btn.title = btn.getAttribute("aria-label") ?? "";
  window.dispatchEvent(new CustomEvent("pp-theme-change", { detail: theme }));
}

export function initTheme() {
  qs("theme-toggle").addEventListener("click", () => {
    const next = effectiveTheme() === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* storage blocked: applies for this session only */
    }
    document.documentElement.setAttribute("data-theme", next);
    sync();
  });
  systemDark.addEventListener("change", sync);
  sync();
}
