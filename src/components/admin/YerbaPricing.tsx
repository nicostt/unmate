"use client";

import { useEffect, useState } from "react";
import { money } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { weightLabel, weightPrice, type WeightTier } from "@/lib/types";

// Cantidades de ejemplo para mostrar cómo quedan los precios.
const SAMPLE_WEIGHTS = [250, 500, 750, 1000, 2000, 3000];

// Los dos cortes del sistema: menos de 1 kg es "poco", 2 kg o más es "mucho".
const SMALL_UNDER = 1000;
const BIG_FROM = 2000;

// Arma los tramos que entiende la tienda a partir de los dos porcentajes.
function toTiers(extra: number, discount: number): WeightTier[] {
  return [
    { min: 0, percent: extra },
    { min: SMALL_UNDER, percent: 0 },
    { min: BIG_FROM, percent: -discount },
  ];
}

// "10", "10%" o "" -> número entero de 0 a 90. Otra cosa -> null (inválido).
function toPercent(text: string): number | null {
  const clean = text.trim().replace("%", "");
  if (clean === "") return 0;
  return /^\d{1,2}$/.test(clean) && Number(clean) <= 90 ? Number(clean) : null;
}

// Precio de la yerba según cuánto se lleve. Cada yerba tiene su precio por
// kilo; acá se decide, para todas las yerbas a la vez:
//   - cuánto MÁS CARO sale el kilo si se lleva menos de 1 kg;
//   - cuánto MÁS BARATO sale si se llevan 2 kg o más.
// Entre 1 kg y 2 kg se cobra el precio normal.
export function YerbaPricing({ samplePrice, onChanged }: { samplePrice: number; onChanged: () => Promise<void> }) {
  const [extra, setExtra] = useState<string>();
  const [discount, setDiscount] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  // Lee lo guardado y lo pasa a los dos casilleros.
  useEffect(() => {
    supabase
      .from("settings")
      .select("value")
      .eq("key", "yerba_tiers")
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) setError(error.message);
        const tiers: WeightTier[] = Array.isArray(data?.value) ? data.value : [];
        const at = (min: number) => tiers.find((t) => t.min === min)?.percent ?? 0;
        setExtra(String(Math.max(0, at(0))));
        setDiscount(String(Math.max(0, -at(BIG_FROM))));
      });
  }, []);

  if (extra === undefined) return <p className="muted">Cargando precios por cantidad…</p>;

  const extraValue = toPercent(extra);
  const discountValue = toPercent(discount);
  const tiers = extraValue !== null && discountValue !== null ? toTiers(extraValue, discountValue) : null;

  async function save() {
    setError("");
    setNote("");
    if (!tiers) return setError("Escribí solo números enteros, por ejemplo 10. Dejá 0 si no querés ajuste.");
    setBusy(true);
    const { error } = await supabase.from("settings").upsert({ key: "yerba_tiers", value: tiers });
    if (error) setError(error.message);
    else {
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
        Vale para todas las yerbas. Entre 1 kg y 2 kg se cobra el precio normal del kilo. Poné 0 donde no quieras
        ajuste.
      </p>

      <div className="tiers">
        <label className="tier-question">
          Si lleva <strong>menos de 1 kg</strong>, ¿cuánto más caro?
          <span>
            <input
              className="field-in"
              inputMode="numeric"
              placeholder="0"
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
            />
            % más caro
          </span>
        </label>
        <label className="tier-question">
          Si lleva <strong>2 kg o más</strong>, ¿cuánto más barato?
          <span>
            <input
              className="field-in"
              inputMode="numeric"
              placeholder="0"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
            % más barato
          </span>
        </label>
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
          {busy ? "Guardando…" : "Guardar"}
        </button>
        {note && <span className="muted">{note}</span>}
      </div>
    </article>
  );
}
