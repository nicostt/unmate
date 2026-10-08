"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

const onlyImages = (files: Iterable<File>) => [...files].filter((f) => f.type.startsWith("image/"));

// Recuadro para cargar fotos de tres maneras:
//  - tocarlo y elegir archivos (en el celular abre la galería o la cámara);
//  - arrastrar las fotos y soltarlas encima;
//  - copiar una imagen (de WhatsApp Web, de una página, una captura) y
//    pegarla con Ctrl+V teniendo el mouse sobre el recuadro.
export function DropZone({
  label,
  busy,
  onFiles,
}: {
  label: string;
  busy: boolean;
  onFiles: (files: File[]) => void;
}) {
  const [over, setOver] = useState(false); // mouse encima o arrastrando algo encima
  const active = useRef(false);
  const deliver = useEffectEvent(onFiles);

  // Pegar: el navegador avisa del Ctrl+V a toda la página, así que solo se
  // atiende si el mouse está sobre ESTE recuadro (puede haber varios a la vez).
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (!active.current || busy) return;
      const files = onlyImages(e.clipboardData?.files ?? []);
      if (files.length) {
        e.preventDefault();
        deliver(files);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [busy]);

  const setActive = (value: boolean) => {
    active.current = value;
    setOver(value);
  };

  return (
    <label
      className={`dropzone${over ? " is-over" : ""}${busy ? " is-busy" : ""}`}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const files = onlyImages(e.dataTransfer.files);
        if (files.length && !busy) onFiles(files);
      }}
    >
      <strong>{busy ? "Subiendo…" : label}</strong>
      <span>Tocá para elegir, arrastrá las fotos acá, o pegalas con Ctrl+V con el mouse encima.</span>
      <input
        className="sr"
        type="file"
        accept="image/*"
        multiple
        disabled={busy}
        onChange={(e) => {
          if (e.target.files?.length) onFiles(onlyImages(e.target.files));
          e.target.value = ""; // permite volver a elegir el mismo archivo
        }}
      />
    </label>
  );
}
