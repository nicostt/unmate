// Íconos de WhatsApp e Instagram para los botones que llevan a esas
// aplicaciones. Los colores de cada botón están en src/styles/controls.css (.btn.wa y
// .btn.ig); el ícono toma el color del texto del botón.

export function WhatsAppIcon() {
  return (
    <svg className="brand-icon" viewBox="0 0 24 24" aria-hidden="true">
      {/* globo de chat con el pico abajo a la izquierda */}
      <path
        d="M12 2.5a9.5 9.5 0 0 0-8.1 14.45L2.5 21.5l4.7-1.35A9.5 9.5 0 1 0 12 2.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* tubo de teléfono */}
      <path
        d="M8.6 7.6c.25-.5.5-.5.75-.5h.6c.2 0 .45.05.65.5.25.55.8 1.9.85 2.05.05.15.1.3 0 .5-.3.6-.75.85-.5 1.3.9 1.5 1.85 2.1 3.2 2.75.35.15.55.1.75-.1.2-.25.85-1 1.1-1.3.2-.3.45-.25.75-.15.3.1 1.9.9 2.2 1.05.3.15.5.25.6.35.05.15.05.75-.2 1.45-.25.7-1.45 1.35-2 1.4-.55.05-1.05.25-3.45-.7-2.9-1.15-4.75-4.1-4.9-4.3-.15-.2-1.15-1.55-1.15-2.95s.75-2.05 1-2.35z"
        fill="currentColor"
        transform="translate(-.9 -.7) scale(.97)"
      />
    </svg>
  );
}

export function InstagramIcon() {
  return (
    <svg
      className="brand-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5.2" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
