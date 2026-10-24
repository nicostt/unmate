"use client";

import { useEffect, useRef, useState } from "react";
import { CARD_PHOTO_ASPECT, cropPhoto } from "./photos";

// Cuánto se puede acercar, como mucho (4 = cuatro veces).
const MAX_ZOOM = 4;

type Ask = { id: number; source: Blob; resolve: (photo: Blob | null) => void };

// Recortador de fotos del panel. Uso:
//
//   const { askCrop, cropper } = useCropper();
//   const photo = await askCrop(file);   // null si tocó "Cancelar"
//   ...
//   return <>{...}{cropper}</>;
//
// askCrop abre la ventana y espera a que se elija el encuadre. Si se piden
// varias (al subir varias fotos juntas), se muestran de a una.
export function useCropper() {
  const [current, setCurrent] = useState<Ask | null>(null);
  const queue = useRef<Ask[]>([]);
  const active = useRef<Ask | null>(null);
  const lastId = useRef(0);

  // muestra la siguiente foto de la fila (o cierra, si no queda ninguna)
  function next() {
    active.current = queue.current.shift() ?? null;
    setCurrent(active.current);
  }

  function askCrop(source: Blob): Promise<Blob | null> {
    return new Promise((resolve) => {
      queue.current.push({
        id: ++lastId.current,
        source,
        resolve: (photo) => {
          resolve(photo);
          next();
        },
      });
      if (!active.current) next();
    });
  }

  // una ventana nueva por foto (key), para que arranque sin acercar ni mover
  const cropper = current && <PhotoCropper key={current.id} source={current.source} onDone={current.resolve} />;
  return { askCrop, cropper };
}

// La ventana: la foto dentro de un recuadro con la forma de la tarjeta de la
// tienda. Lo que se ve en el recuadro es lo que va a aparecer. Se arrastra
// para moverla; se acerca con la barra o con la ruedita del mouse.
function PhotoCropper({ source, onDone: finish }: { source: Blob; onDone: (photo: Blob | null) => void }) {
  const frame = useRef<HTMLDivElement>(null);
  const [url] = useState(() => URL.createObjectURL(source));
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  // centro de lo que se ve, en fracciones de la foto (0,5 = el medio)
  const [center, setCenter] = useState({ x: 0.5, y: 0.5 });
  const [saving, setSaving] = useState(false);
  // la dirección temporal de la foto se libera recién al cerrar la ventana
  function onDone(photo: Blob | null) {
    URL.revokeObjectURL(url);
    finish(photo);
  }
  const drag = useRef<{ x: number; y: number; center: { x: number; y: number } } | null>(null);

  // tamaño del recuadro en pantalla (cambia si se gira el celular)
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Escala para que la foto cubra el recuadro sin dejar huecos, por el zoom.
  const scale = natural && box ? Math.max(box.w / natural.w, box.h / natural.h) * zoom : 0;

  // El centro no puede ir tan lejos que se vea el borde de la foto.
  function clamp(c: { x: number; y: number }, s = scale) {
    if (!natural || !box || !s) return c;
    const halfW = box.w / s / 2 / natural.w;
    const halfH = box.h / s / 2 / natural.h;
    return {
      x: Math.min(1 - halfW, Math.max(halfW, c.x)),
      y: Math.min(1 - halfH, Math.max(halfH, c.y)),
    };
  }
  const shown = clamp(center);

  // la ruedita del mouse acerca y aleja (sin mover la página)
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => Math.min(MAX_ZOOM, Math.max(1, z * (e.deltaY < 0 ? 1.08 : 1 / 1.08))));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, center: shown };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current || !natural || !scale) return;
    // mover la foto hacia la derecha es mirar más a la izquierda
    const dx = (e.clientX - drag.current.x) / scale / natural.w;
    const dy = (e.clientY - drag.current.y) / scale / natural.h;
    setCenter(clamp({ x: drag.current.center.x - dx, y: drag.current.center.y - dy }));
  }
  function onPointerUp() {
    drag.current = null;
  }

  // flechas del teclado: mueven de a poco
  function onKeyDown(e: React.KeyboardEvent) {
    const step = 0.02 / zoom;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    setCenter(clamp({ x: shown.x + move[0], y: shown.y + move[1] }));
  }

  async function done() {
    if (!natural || !box || !scale) return;
    setSaving(true);
    const width = box.w / scale;
    const height = box.h / scale;
    try {
      const photo = await cropPhoto(source, {
        x: shown.x * natural.w - width / 2,
        y: shown.y * natural.h - height / 2,
        width,
        height,
      });
      onDone(photo);
    } catch {
      setSaving(false);
    }
  }

  // posición de la foto dentro del recuadro
  const imgStyle: React.CSSProperties =
    natural && box && scale
      ? {
          width: natural.w * scale,
          height: natural.h * scale,
          left: box.w / 2 - shown.x * natural.w * scale,
          top: box.h / 2 - shown.y * natural.h * scale,
        }
      : { opacity: 0 };

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="cropper-title">
      <div className="modal-card cropper">
        <h3 id="cropper-title">Encuadrá la foto</h3>
        <p className="muted">
          Arrastrá para moverla y acercala con la barra (o la ruedita del mouse). Lo que se ve en el recuadro es lo que
          va a aparecer en la tienda.
        </p>
        <div
          ref={frame}
          className="cropper-frame"
          style={{ aspectRatio: CARD_PHOTO_ASPECT }}
          tabIndex={0}
          aria-label="Foto: arrastrá o usá las flechas para moverla"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- foto local recién elegida, sin optimizar */}
          <img
            src={url}
            alt=""
            draggable={false}
            style={imgStyle}
            onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
          />
        </div>
        <label className="cropper-zoom">
          <span>Acercar</span>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </label>
        <div className="cropper-actions">
          <button className="btn ghost" type="button" disabled={saving} onClick={() => onDone(null)}>
            Cancelar
          </button>
          <button className="btn primary" type="button" disabled={saving || !natural} onClick={done}>
            {saving ? "Guardando…" : "Listo"}
          </button>
        </div>
      </div>
    </div>
  );
}
