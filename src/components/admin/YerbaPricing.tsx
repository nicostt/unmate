"use client";

import { money } from "@/lib/format";
import { weightLabel, weightPrice, weightTiers } from "@/lib/types";

// Cantidades de ejemplo para mostrar cómo quedan los precios.
const SAMPLE_WEIGHTS = [250, 500, 750, 1000, 2000, 3000];

// "10", "10%" o "" -> número entero de 0 a 90. Otra cosa -> null (inválido).
export function toPercent(text: string): number | null {
  const clean = text.trim().replace("%", "");
  if (clean === "") return 0;
  return /^\d{1,2}$/.test(clean) && Number(clean) <= 90 ? Number(clean) : null;
}

// Parte del formulario de una yerba suelta: cuánto cambia su precio según
// la cantidad que lleven. Son dos preguntas, y es propio de cada yerba:
//   - cuánto MÁS CARO sale el kilo si se lleva menos de 1 kg;
//   - cuánto MÁS BARATO sale si se llevan 2 kg o más.
// Entre 1 kg y 2 kg se cobra el precio normal. Abajo muestra cómo queda.
export function YerbaPricing({
  pricePerKilo,
  extra,
  discount,
  onChange,
}: {
  pricePerKilo: number | null; // null si todavía no se cargó un precio válido
  extra: string;
  discount: string;
  onChange: (patch: { weight_extra?: string; weight_discount?: string }) => void;
}) {
  const extraValue = toPercent(extra);
  const discountValue = toPercent(discount);
  const tiers = extraValue !== null && discountValue !== null ? weightTiers(extraValue, discountValue) : null;

  return (
    <div className="admin-pricing wide">
      <strong>Precio según la cantidad</strong>
      <p className="muted">
        Para que convenga llevar más. Entre 1 kg y 2 kg se cobra el precio normal. Dejá 0 donde no quieras ajuste.
      </p>
      <label className="tier-question">
        Si lleva <b>menos de 1 kg</b>, ¿cuánto más caro?
        <span>
          <input
            className="field-in"
            inputMode="numeric"
            placeholder="0"
            value={extra}
            onChange={(e) => onChange({ weight_extra: e.target.value })}
          />
          % más caro
        </span>
      </label>
      <label className="tier-question">
        Si lleva <b>2 kg o más</b>, ¿cuánto más barato?
        <span>
          <input
            className="field-in"
            inputMode="numeric"
            placeholder="0"
            value={discount}
            onChange={(e) => onChange({ weight_discount: e.target.value })}
          />
          % más barato
        </span>
      </label>

      {tiers && pricePerKilo ? (
        <div className="tiers-preview">
          <p className="muted">Así queda con {money(pricePerKilo)} el kilo:</p>
          <ul>
            {SAMPLE_WEIGHTS.map((grams) => {
              const price = weightPrice(pricePerKilo, grams, tiers);
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
      ) : (
        <p className="muted">Cargá el precio del kilo para ver cómo queda cada cantidad.</p>
      )}
    </div>
  );
}
