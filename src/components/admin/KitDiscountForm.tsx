"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { KIT_PARTS } from "@/lib/types";
import { toPercent } from "./YerbaPricing";

// Nombre con que se guarda el ajuste en la tabla `settings`.
const KEY = "kit_discount";

// Descuento por armar equipo: cuánto se descuenta y a partir de cuántas
// partes (mate, bombilla, termo, yerba en paquete). Se guarda en la tabla
// `settings`; la tienda lo lee de ahí y la base lo aplica al registrar el
// pedido (ver supabase/migrations/0007_descuento_por_equipo.sql).
export function KitDiscountForm({ onChanged }: { onChanged: () => Promise<void> }) {
  const [percent, setPercent] = useState("");
  const [min, setMin] = useState(3);
  // undefined = todavía cargando; false = falta ejecutar el SQL 0007
  const [ready, setReady] = useState<boolean>();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("settings")
      .select("value")
      .eq("key", KEY)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const value = data?.value as { percent?: number; min?: number } | undefined;
        setReady(Boolean(value));
        if (value) {
          setPercent(value.percent ? String(value.percent) : "");
          setMin(value.min ?? 3);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    const value = toPercent(percent);
    if (value === null) return setMessage("El descuento tiene que ser un número entero de 0 a 90.");
    setBusy(true);
    setMessage("");
    const { error } = await supabase.from("settings").update({ value: { percent: value, min } }).eq("key", KEY);
    if (error) setMessage(error.message);
    else setMessage(value ? `Guardado: ${value} % llevando ${min} partes o más.` : "Guardado: el descuento quedó apagado.");
    await onChanged();
    setBusy(false);
  }

  return (
    <section className="admin-section">
      <div className="admin-bar">
        <h2>Descuento por armar equipo</h2>
      </div>
      <div className="admin-pricing">
        <p className="muted">
          El equipo tiene {KIT_PARTS.length} partes: mate, bombilla, termo y yerba en paquete. Si alguien lleva varias,
          se le descuenta un porcentaje sobre un producto de cada parte (el más caro). Se aplica en “Armá tu equipo” y
          también si las suma sueltas al carrito. Con 0 queda apagado.
        </p>
        {ready === false ? (
          <p className="admin-error">
            Para usar esto falta ejecutar en Supabase el archivo 0007_descuento_por_equipo.sql.
          </p>
        ) : (
          <>
            <label className="tier-question">
              ¿Cuánto descuento?
              <span>
                <input
                  className="field-in"
                  inputMode="numeric"
                  placeholder="0"
                  value={percent}
                  disabled={!ready}
                  onChange={(e) => setPercent(e.target.value)}
                />
                % de descuento
              </span>
            </label>
            <div className="tier-question">
              ¿A partir de cuántas partes?
              <div className="chips" role="group" aria-label="Partes necesarias">
                {[2, 3, 4].map((n) => (
                  <button
                    key={n}
                    className="chip"
                    type="button"
                    aria-pressed={min === n}
                    disabled={!ready}
                    onClick={() => setMin(n)}
                  >
                    {n === KIT_PARTS.length ? `Las ${n}` : `${n} o más`}
                  </button>
                ))}
              </div>
            </div>
            <div className="admin-submit">
              <button className="btn primary small" type="button" disabled={!ready || busy} onClick={save}>
                {busy ? "Guardando…" : "Guardar descuento"}
              </button>
              {message && <span className="muted">{message}</span>}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
