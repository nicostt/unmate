import type { Shape } from "@/lib/types";

// Ilustraciones de línea que se muestran mientras no hay fotos reales.
// Cada mate se dibuja a partir de cinco medidas: ancho de boca (tw), de
// panza (mw) y de base (bw), y altura de la boca (ty) y de la base (by).

const MATES: Partial<Record<Shape, { tw: number; mw: number; bw: number; ty: number; by: number }>> = {
  camionero: { tw: 76, mw: 86, bw: 48, ty: 46, by: 102 },
  imperial: { tw: 60, mw: 82, bw: 34, ty: 42, by: 102 },
  torpedo: { tw: 44, mw: 52, bw: 20, ty: 32, by: 104 },
  ranchero: { tw: 66, mw: 78, bw: 42, ty: 44, by: 102 },
  criollo: { tw: 58, mw: 72, bw: 36, ty: 46, by: 102 },
};

function Mate({ tw, mw, bw, ty, by }: { tw: number; mw: number; bw: number; ty: number; by: number }) {
  const cx = 60;
  const l1 = cx - tw / 2;
  const r1 = cx + tw / 2;
  const lm = cx - mw / 2;
  const rm = cx + mw / 2;
  const lb = cx - bw / 2;
  const rb = cx + bw / 2;
  const my = ty + (by - ty) * 0.42;
  const k = (by - my) * 0.7;
  const body =
    `M${l1} ${ty} C${lm - 3} ${ty + 8} ${lm} ${my - 12} ${lm} ${my} ` +
    `C${lm} ${my + k} ${lb - 2} ${by - 6} ${lb} ${by} L${rb} ${by} ` +
    `C${rb + 2} ${by - 6} ${rm} ${my + k} ${rm} ${my} ` +
    `C${rm} ${my - 12} ${r1 + 3} ${ty + 8} ${r1} ${ty}`;
  const rim = `M${l1} ${ty} Q${cx} ${ty - 7} ${r1} ${ty} M${l1} ${ty} Q${cx} ${ty + 7} ${r1} ${ty}`;
  const straw = `M${cx + 10} ${ty + 3} L${cx + 30} ${ty - 26} M${cx + 30} ${ty - 26} L${cx + 35} ${ty - 29}`;
  return (
    <>
      <path d={body} />
      <path d={rim} />
      <path d={`M${lb - 5} ${by + 7} L${rb + 5} ${by + 7}`} opacity={0.6} />
      <path d={straw} />
    </>
  );
}

function Termo() {
  return (
    <>
      <rect x="42" y="30" width="36" height="76" rx="9" />
      <rect x="42" y="20" width="36" height="13" rx="4" />
      <path d="M78 48h6a8 8 0 0 1 8 8v16a8 8 0 0 1-8 8h-6" />
      <path d="M42 58h36M42 66h36" opacity={0.4} />
    </>
  );
}

function Bombilla({ shape }: { shape: Shape }) {
  const bulb = shape === "loro" ? 9 : 13;
  let stem = "M44 98 L80 24 L86 26";
  if (shape === "loro") stem = "M44 98 L68 36 Q72 24 88 20 L93 24";
  if (shape === "bombillon-curvo") stem = "M44 98 L66 40 Q70 26 86 22 L90 26";
  return (
    <>
      <path d={stem} />
      <ellipse cx="42" cy="99" rx={bulb} ry={bulb + 5} transform="rotate(22 42 99)" />
      <path d="M38 92l8 14M34 98l9 11" opacity={0.4} />
    </>
  );
}

export function ProductArt({ shape }: { shape: Shape }) {
  const mate = MATES[shape];
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 92A50 50 0 1 1 106 92" opacity={0.32} />
      {mate ? <Mate {...mate} /> : shape === "termo" ? <Termo /> : <Bombilla shape={shape} />}
    </svg>
  );
}
