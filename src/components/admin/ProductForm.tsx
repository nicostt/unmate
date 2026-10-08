"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { PhotoManager } from "./PhotoManager";
import { parsePricing, slugify, type AdminCategory, type AdminProduct } from "./types";
import { VariantManager } from "./VariantManager";

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
  ["yerba", "Paquete de yerba"],
];

const text = (value: string | number | null) => (value === null ? "" : String(value));

// Formulario para crear un producto (product = null) o editar uno existente.
export function ProductForm({
  product,
  categories,
  nextSortOrder,
  onBack,
  onSaved,
  onChanged,
}: {
  product: AdminProduct | null;
  categories: AdminCategory[];
  nextSortOrder: number;
  onBack: () => void;
  onSaved: (id: number) => Promise<void>;
  onChanged: () => Promise<void>;
}) {
  const [f, setF] = useState({
    name: product?.name ?? "",
    category_id: String(product?.category_id ?? categories[0]?.id ?? ""),
    shape: product?.shape ?? "camionero",
    material: product?.material ?? "",
    description: product?.description ?? "",
    price: text(product?.price ?? null),
    compare_at_price: text(product?.compare_at_price ?? null),
    stock: text(product?.stock ?? null),
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

    if (!f.name.trim()) return setError("Falta el nombre.");
    const parsed = parsePricing(f.price, f.compare_at_price, f.stock);
    if (parsed.error) return setError(parsed.error);

    const values = {
      name: f.name.trim(),
      category_id: Number(f.category_id),
      shape: f.shape,
      material: f.material.trim() || null,
      description: f.description.trim() || null,
      ...parsed.values!,
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
      <h2>{product ? `Editar: ${product.name}` : "Producto nuevo"}</h2>

      <form className="admin-form" onSubmit={submit}>
        <label className="wide">
          Nombre
          <input className="field-in" required {...field("name")} />
        </label>
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
            {busy ? "Guardando…" : product ? "Guardar cambios" : "Crear producto"}
          </button>
          {note && <span className="muted">{note}</span>}
        </div>
      </form>

      {product ? (
        <>
          <VariantManager product={product} onChanged={onChanged} />
          <PhotoManager product={product} onChanged={onChanged} />
        </>
      ) : (
        <p className="muted">Las presentaciones y las fotos se agregan después de crear el producto.</p>
      )}
    </div>
  );
}
