"use client";

import { useEffect, useState } from "react";
import { money } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { weightLabel, weightPrice, type WeightTier } from "@/lib/types";
import { gramsToKilos, kilosToGrams } from "./types";

// Precio de ejemplo para mostrar cómo quedan los tramos.
const SAMPLE_WEIGHTS = [250, 500, 750, 1000, 2000, 3000];

type Row = { kilos: string; percent: string };

const toRows = (tiers: WeightTier[]): Row[] =>
  [...tiers].sort((a, b) => a.min - b.min).map((t) => ({ kilos: gramsToKilos(t.min), percent: String(t.percent) }));

// Precio de la yerba según cuánto se lleve. Cada yerba tiene su precio base
// por kilo; acá se define cuánto sube o baja ese precio por tramo de
// cantidad, y vale para todas las yerbas.
//   "Desde 0 kg: +10"  -> comprando menos de lo que diga el tramo siguiente, 10 % más caro
//   "Desde 1 kg: 0"    -> precio base
//   "Desde 2 kg: -8"   -> 8 % más barato
export function YerbaPricing({ samplePrice, onChanged }: { samplePrice: number; onChanged: () => Promise<void> }) {
  const [rows, setRows] = useState<Row[]>();
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase
      .from("settings")
      .select("value")
      .eq("key", "yerba_tiers")
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setRows(toRows(Array.isArray(data?.value) && data.value.length ? data.value : [{ min: 0, percent: 0 }]));
      });
  }, []);

  if (!rows) return <p className="muted">Cargando precios por cantidad…</p>;

  // Convierte lo escrito en tramos; null si hay algo mal cargado.
  function parse(): WeightTier[] | null {
    const tiers: WeightTier[] = [];
    for (const row of rows!) {
      const min = kilosToGrams(row.kilos) ?? 0;
      const percent = Number(row.percent.replace(",", ".").replace("%", "") || 0);
      if (Number.isNaN(min) || !Number.isInteger(percent) || percent <= -100) return null;
      tiers.push({ min, percent });
    }
    return tiers.sort((a, b) => a.min - b.min);
  }

  const tiers = parse();
  const edit = (i: number, patch: Partial<Row>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  async function save() {
    setError("");
    setNote("");
    if (!tiers) return setError("Revisá los números: los kilos van como 1 o 0,5 y el porcentaje como 10 o -8, sin decimales.");
    if (!tiers.some((t) => t.min === 0))
      return setError('Tiene que haber un tramo "desde 0 kg", para las compras más chicas.');
    setBusy(true);
    const { error } = await supabase.from("settings").upsert({ key: "yerba_tiers", value: tiers });
    if (error) setError(error.message);
    else {
      setRows(toRows(tiers));
      setNote("Guardado.");
      await onChanged();
    }
    setBusy(false);
  }

  return (
    <article className="admin-design">
      <header>
        <strong>Precio según la cantidad</strong>
      </header>
      <p className="muted">
        Cada yerba tiene su precio base por kilo. Acá decidís cuánto cambia ese precio según cuánto lleven, para todas
        las yerbas. Un número positivo encarece (+10 = 10 % más caro) y uno negativo abarata (-8 = 8 % más barato).
        Dejá todo en 0 para cobrar siempre proporcional al kilo.
      </p>

      <div className="tiers">
        {rows.map((row, i) => (
          <div className="tier" key={i}>
            <label>
              Desde (kg)
              <input
                className="field-in"
                inputMode="decimal"
                value={row.kilos}
                onChange={(e) => edit(i, { kilos: e.target.value })}
              />
            </label>
            <label>
              Ajuste (%)
              <input
                className="field-in"
                inputMode="numeric"
                placeholder="0"
                value={row.percent}
                onChange={(e) => edit(i, { percent: e.target.value })}
              />
            </label>
            <button
              className="btn ghost small danger"
              type="button"
              disabled={rows.length === 1}
              onClick={() => setRows(rows.filter((_, j) => j !== i))}
            >
              Quitar
            </button>
          </div>
        ))}
        <button className="btn ghost small" type="button" onClick={() => setRows([...rows, { kilos: "", percent: "" }])}>
          + Agregar tramo
        </button>
      </div>

      {tiers && (
        <div className="tiers-preview">
          <p className="muted">Así queda una yerba de {money(samplePrice)} el kilo:</p>
          <ul>
            {SAMPLE_WEIGHTS.map((grams) => {
              const price = weightPrice(samplePrice, grams, tiers);
              return (
                <li key={grams}>
                  <strong>{weightLabel(grams)}</strong>
                  <span>{money(price)}</span>
                  <small className="muted">{money(Math.round((price / grams) * 1000))} el kg</small>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {error && <p className="admin-error">{error}</p>}
      <div className="admin-submit">
        <button className="btn primary small" type="button" disabled={busy} onClick={save}>
          {busy ? "Guardando…" : "Guardar precios por cantidad"}
        </button>
        {note && <span className="muted">{note}</span>}
      </div>
    </article>
  );
}
