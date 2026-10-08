"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { PhotoManager } from "./PhotoManager";
import {
  gramsToKilos,
  kilosToGrams,
  slugify,
  toInt,
  type AdminCategory,
  type AdminProduct,
} from "./types";

// Ilustraciones disponibles para cuando un producto no tiene fotos.
const SHAPES = [
  ["camionero", "Mate camionero"],
  ["imperial", "Mate imperial"],
  ["torpedo", "Mate torpedo"],
  ["ranchero", "Mate ranchero"],
  ["criollo", "Mate criollo"],
  ["loro", "Bombilla pico loro"],
  ["bombillon", "Bombillón recto"],
  ["bombillon-curvo", "Bombillón curvo"],
  ["termo", "Termo"],
];

const text = (value: string | number | null) => (value === null ? "" : String(value));

// Formulario para crear (product = null) o editar un producto.
// Con kind = "yerba" es la versión corta: nombre, precio del kilo y kilos
// disponibles. La categoría y el dibujo se ponen solos.
export function ProductForm({
  kind,
  product,
  categories,
  yerbaCategoryId,
  nextSortOrder,
  onBack,
  onSaved,
  onChanged,
}: {
  kind: "product" | "yerba";
  product: AdminProduct | null;
  categories: AdminCategory[];
  yerbaCategoryId: number | undefined;
  nextSortOrder: number;
  onBack: () => void;
  onSaved: (id: number) => Promise<void>;
  onChanged: () => Promise<void>;
}) {
  const yerba = kind === "yerba";
  const [f, setF] = useState({
    name: product?.name ?? "",
    category_id: String(product?.category_id ?? categories[0]?.id ?? ""),
    shape: product?.shape ?? "camionero",
    material: product?.material ?? "",
    description: product?.description ?? "",
    price: text(product?.price ?? null),
    compare_at_price: text(product?.compare_at_price ?? null),
    // la yerba se carga en kilos, aunque en la base se guarden gramos
    stock: yerba ? gramsToKilos(product?.stock ?? null) : text(product?.stock ?? null),
    is_active: product?.is_active ?? true,
  });
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  // Devuelve las propiedades de un campo de texto atado a f[key].
  const field = (key: "name" | "material" | "description" | "price" | "compare_at_price" | "stock") => ({
    value: f[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setF({ ...f, [key]: e.target.value }),
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNote("");

    const price = toInt(f.price);
    const compare = toInt(f.compare_at_price);
    const stock = yerba ? kilosToGrams(f.stock) : toInt(f.stock);
    if (!f.name.trim()) return setError("Falta el nombre.");
    if (price === null || Number.isNaN(price)) return setError("El precio tiene que ser un número.");
    if (Number.isNaN(compare)) return setError('El precio "antes" tiene que ser un número o quedar vacío.');
    if (compare !== null && compare <= price)
      return setError('El precio "antes" tiene que ser mayor que el precio actual.');
    if (Number.isNaN(stock))
      return setError(
        yerba ? "Los kilos tienen que ser un número (por ejemplo 12,5) o quedar vacío." : "El stock tiene que ser un número o quedar vacío.",
      );
    if (yerba && !yerbaCategoryId) return setError("No se encontró la categoría Yerba. Volvé a la lista y probá de nuevo.");

    const values = {
      name: f.name.trim(),
      category_id: yerba ? yerbaCategoryId : Number(f.category_id),
      shape: yerba ? "yerba" : f.shape,
      material: f.material.trim() || null,
      description: f.description.trim() || null,
      price,
      compare_at_price: compare,
      stock,
      is_active: f.is_active,
    };

    setBusy(true);
    const result = product
      ? await supabase
          .from("products")
          .update({ ...values, updated_at: new Date().toISOString() })
          .eq("id", product.id)
          .select("id")
          .single()
      : await supabase
          .from("products")
          .insert({ ...values, slug: slugify(values.name), sort_order: nextSortOrder })
          .select("id")
          .single();

    if (result.error) {
      // 23505 = valor repetido en una columna única (acá, el slug que sale del nombre)
      setError(
        result.error.code === "23505" ? "Ya existe un producto con ese nombre." : result.error.message,
      );
    } else {
      await onSaved(result.data.id);
      setNote("Guardado.");
    }
    setBusy(false);
  }

  return (
    <div className="admin-form-wrap">
      <button className="btn ghost small" type="button" onClick={onBack}>
        ← Volver a la lista
      </button>
      <h2>{product ? `Editar: ${product.name}` : yerba ? "Yerba nueva" : "Producto nuevo"}</h2>

      <form className="admin-form" onSubmit={submit}>
        <label className="wide">
          Nombre
          <input className="field-in" required placeholder={yerba ? "Yerba Canarias" : undefined} {...field("name")} />
        </label>

        {yerba ? (
          <>
            <label>
              Precio del kilo
              <input className="field-in" inputMode="numeric" placeholder="8000" required {...field("price")} />
            </label>
            <label>
              Kilos disponibles <small>(vacío = no se controla)</small>
              <input className="field-in" inputMode="decimal" placeholder="12,5" {...field("stock")} />
            </label>
          </>
        ) : (
          <>
            <label>
              Categoría
              <select
                className="field-in"
                value={f.category_id}
                onChange={(e) => setF({ ...f, category_id: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Material <small>(opcional)</small>
              <input className="field-in" placeholder="Calabaza, algarrobo, bronce…" {...field("material")} />
            </label>
            <label>
              Precio
              <input className="field-in" inputMode="numeric" placeholder="34900" required {...field("price")} />
            </label>
            <label>
              Precio antes <small>(solo si está en oferta)</small>
              <input className="field-in" inputMode="numeric" placeholder="41900" {...field("compare_at_price")} />
            </label>
            <label>
              Stock <small>(vacío = no se controla)</small>
              <input className="field-in" inputMode="numeric" placeholder="—" {...field("stock")} />
            </label>
            <label>
              Dibujo si no hay fotos
              <select className="field-in" value={f.shape} onChange={(e) => setF({ ...f, shape: e.target.value })}>
                {SHAPES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}

        <label className="wide">
          Descripción <small>(opcional)</small>
          <textarea className="field-in" rows={3} {...field("description")} />
        </label>
        <label className="admin-check wide">
          <input
            type="checkbox"
            checked={f.is_active}
            onChange={(e) => setF({ ...f, is_active: e.target.checked })}
          />
          Visible en la tienda
        </label>

        {error && <p className="admin-error wide">{error}</p>}
        <div className="admin-submit wide">
          <button className="btn primary" type="submit" disabled={busy}>
            {busy ? "Guardando…" : product ? "Guardar cambios" : yerba ? "Crear yerba" : "Crear producto"}
          </button>
          {note && <span className="muted">{note}</span>}
        </div>
      </form>

      {product ? (
        <PhotoManager product={product} onChanged={onChanged} />
      ) : (
        <p className="muted">Las fotos se agregan después de crear {yerba ? "la yerba" : "el producto"}.</p>
      )}
    </div>
  );
}
