"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { parsePricing, variantsOf, type AdminProduct, type AdminVariant } from "./types";

const text = (value: number | null) => (value === null ? "" : String(value));

// Presentaciones de un producto (por ejemplo "500 g" y "1 kg"), cada una con
// su precio y su stock. Si un producto tiene presentaciones, la tienda vende
// por presentación y deja de usar el precio y el stock generales.
export function VariantManager({ product, onChanged }: { product: AdminProduct; onChanged: () => Promise<void> }) {
  const variants = variantsOf(product);
  const [error, setError] = useState("");

  // Ejecuta un cambio y después deja el precio general del producto igual al
  // de la presentación más barata (es el que usa la tienda para ordenar).
  async function run(action: PromiseLike<{ error: { message: string } | null }>) {
    setError("");
    const { error } = await action;
    if (error) {
      setError(error.message);
      return false;
    }
    const { data } = await supabase.from("product_variants").select("price").eq("product_id", product.id);
    if (data?.length) {
      const cheapest = Math.min(...data.map((v) => v.price));
      await supabase.from("products").update({ price: cheapest, compare_at_price: null }).eq("id", product.id);
    }
    await onChanged();
    return true;
  }

  return (
    <section className="admin-photos">
      <h3>Presentaciones</h3>
      <p className="muted">
        Para productos que se venden en varios tamaños, como la yerba: 500 g, 1 kg, 2 kg. Cada una tiene su precio y
        su stock, y el cliente elige cuál lleva. Si no cargás ninguna, se usa el precio y el stock de arriba.
      </p>

      <div className="admin-variants">
        {variants.map((variant) => (
          <VariantRow
            key={variant.id}
            variant={variant}
            onSave={(values) => run(supabase.from("product_variants").update(values).eq("id", variant.id))}
            onDelete={() => run(supabase.from("product_variants").delete().eq("id", variant.id))}
          />
        ))}
        <VariantRow
          // key: después de agregar una, el renglón vacío se reinicia
          key={`nueva-${variants.length}`}
          variant={null}
          onSave={(values) =>
            run(
              supabase.from("product_variants").insert({
                ...values,
                product_id: product.id,
                sort_order: Math.max(0, ...variants.map((v) => v.sort_order)) + 1,
              }),
            )
          }
        />
      </div>
      {error && <p className="admin-error">{error}</p>}
    </section>
  );
}

type VariantValues = { label: string; price: number; compare_at_price: number | null; stock: number | null };

// Un renglón: una presentación existente, o el renglón vacío para agregar otra.
function VariantRow({
  variant,
  onSave,
  onDelete,
}: {
  variant: AdminVariant | null;
  onSave: (values: VariantValues) => Promise<boolean>;
  onDelete?: () => Promise<boolean>;
}) {
  const [f, setF] = useState({
    label: variant?.label ?? "",
    price: text(variant?.price ?? null),
    compare: text(variant?.compare_at_price ?? null),
    stock: text(variant?.stock ?? null),
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const field = (key: keyof typeof f) => ({
    value: f[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [key]: e.target.value }),
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!f.label.trim()) return setError("Falta el nombre de la presentación (por ejemplo: 1 kg).");
    const parsed = parsePricing(f.price, f.compare, f.stock);
    if (parsed.error) return setError(parsed.error);
    setBusy(true);
    await onSave({ label: f.label.trim(), ...parsed.values! });
    setBusy(false);
  }

  return (
    <form className="admin-variant" onSubmit={save}>
      <label>
        Presentación
        <input className="field-in" placeholder="1 kg" {...field("label")} />
      </label>
      <label>
        Precio
        <input className="field-in" inputMode="numeric" placeholder="8500" {...field("price")} />
      </label>
      <label>
        Antes
        <input className="field-in" inputMode="numeric" placeholder="—" {...field("compare")} />
      </label>
      <label>
        Stock
        <input className="field-in" inputMode="numeric" placeholder="—" {...field("stock")} />
      </label>
      <div className="admin-actions">
        <button className="btn ghost small" type="submit" disabled={busy}>
          {variant ? "Guardar" : "+ Agregar"}
        </button>
        {onDelete && (
          <button
            className="btn ghost small danger"
            type="button"
            disabled={busy}
            onClick={() => confirm(`¿Borrar la presentación "${variant?.label}"?`) && onDelete()}
          >
            Borrar
          </button>
        )}
      </div>
      {error && <p className="admin-error wide">{error}</p>}
    </form>
  );
}
