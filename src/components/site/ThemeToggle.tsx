"use client";

// Botón de modo claro / oscuro. El tema es un atributo data-theme en <html>
// (lo lee globals.css) y la elección se guarda en el navegador. Si el
// visitante nunca eligió, se usa el modo de su dispositivo.
// Al recargar, la elección guardada la aplica THEME_SCRIPT (src/lib/theme.ts).

import { THEME_KEY } from "@/lib/theme";

function toggleTheme() {
  const root = document.documentElement;
  const current =
    root.dataset.theme ?? (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  const next = current === "light" ? "dark" : "light";
  root.dataset.theme = next;
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    // sin almacenamiento: el cambio vale hasta recargar
  }
}

export function ThemeToggle() {
  return (
    <button
      className="icon-btn theme-btn"
      type="button"
      onClick={toggleTheme}
      aria-label="Cambiar entre modo claro y oscuro"
      title="Modo claro / oscuro"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <g className="sun">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
        </g>
        <path className="moon" d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
      </svg>
    </button>
  );
}
