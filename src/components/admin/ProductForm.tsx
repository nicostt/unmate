"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { DesignManager } from "./DesignManager";
import { PhotoManager } from "./PhotoManager";
import {
  gramsToKilos,
  kilosToGrams,
  slugify,
  toInt,
  type AdminCategory,
  type AdminProduct,
} from "./types";
import { toPercent, YerbaPricing } from "./YerbaPricing";

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

// Qué se está cargando. Cambia qué campos muestra el formulario:
//  - "product": un producto común (mate, bombilla, termo...), con todos los campos;
//  - "yerba":   yerba suelta, por peso: precio del kilo, kilos y ajuste por cantidad;
//  - "pack":    yerba en paquete, por unidad: precio del paquete y cuántos hay.
// En "yerba" y "pack" la categoría y el dibujo se ponen solos.
export type FormKind = "product" | "yerba" | "pack";

const TITLES: Record<FormKind, [string, string]> = {
  product: ["Producto nuevo", "Crear producto"],
  yerba: ["Yerba suelta nueva", "Crear yerba"],
  pack: ["Paquete de yerba nuevo", "Crear paquete"],
};

const text = (value: string | number | null) => (value === null ? "" : String(value));

// Formulario para crear (product = null) o editar un producto.
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
  kind: FormKind;
  product: AdminProduct | null;
  categories: AdminCategory[];
  yerbaCategoryId: number | undefined;
  nextSortOrder: number;
  onBack: () => void;
  onSaved: (id: number) => Promise<void>;
  onChanged: () => Promise<void>;
}) {
  const loose = kind === "yerba"; // yerba suelta
  const common = kind === "product";
  const [f, setF] = useState({
    name: product?.name ?? "",
    category_id: String(product?.category_id ?? categories[0]?.id ?? ""),
    shape: product?.shape ?? "camionero",
    material: product?.material ?? "",
    description: product?.description ?? "",
    price: text(product?.price ?? null),
    compare_at_price: text(product?.compare_at_price ?? null),
    // la yerba suelta se carga en kilos, aunque en la base se guarden gramos
    stock: loose ? gramsToKilos(product?.stock ?? null) : text(product?.stock ?? null),
    is_active: product?.is_active ?? true,
    by_design: product?.by_design ?? false,
    weight_extra: String(product?.weight_extra ?? 0),
    weight_discount: String(product?.weight_discount ?? 0),
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
    // en un producto por diseños el stock es la cantidad de diseños: el número no se usa
    const stock = f.by_design ? null : loose ? kilosToGrams(f.stock) : toInt(f.stock);
    const extra = toPercent(f.weight_extra);
    const discount = toPercent(f.weight_discount);
    if (!f.name.trim()) return setError("Falta el nombre.");
    if (price === null || Number.isNaN(price)) return setError("El precio tiene que ser un número.");
    if (Number.isNaN(compare)) return setError('El precio "antes" tiene que ser un número o quedar vacío.');
    if (compare !== null && compare <= price)
      return setError('El precio "antes" tiene que ser mayor que el precio actual.');
    if (Number.isNaN(stock))
      return setError(
        loose
          ? "Los kilos tienen que ser un número (por ejemplo 12,5) o quedar vacío."
          : "El stock tiene que ser un número o quedar vacío.",
      );
    if (loose && (extra === null || discount === null))
      return setError("Los porcentajes van como número entero, por ejemplo 10. Dejá 0 si no querés ajuste.");
    if (!common && !yerbaCategoryId)
      return setError("No se encontró la categoría Yerba. Volvé a la lista y probá de nuevo.");

    const values = {
      name: f.name.trim(),
      category_id: common ? Number(f.category_id) : yerbaCategoryId,
      shape: common ? f.shape : "yerba",
      material: f.material.trim() || null,
      description: f.description.trim() || null,
      price,
      compare_at_price: compare,
      stock,
      is_active: f.is_active,
      by_design: common && f.by_design,
      by_weight: loose,
      weight_extra: loose ? extra : 0,
      weight_discount: loose ? discount : 0,
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
      <h2>{product ? `Editar: ${product.name}` : TITLES[kind][0]}</h2>

      <form className="admin-form" onSubmit={submit}>
        <label className="wide">
          Nombre
          <input
            className="field-in"
            required
            placeholder={loose ? "Yerba Canarias" : kind === "pack" ? "Yerba Canarias 1 kg" : undefined}
            {...field("name")}
          />
        </label>

        {loose && (
          <>
            <label>
              Precio del kilo
              <input className="field-in" inputMode="numeric" placeholder="8000" required {...field("price")} />
            </label>
            <label>
              Kilos disponibles <small>(vacío = no se controla)</small>
              <input className="field-in" inputMode="decimal" placeholder="12,5" {...field("stock")} />
            </label>
            <YerbaPricing
              pricePerKilo={toInt(f.price) || null}
              extra={f.weight_extra}
              discount={f.weight_discount}
              onChange={(patch) => setF({ ...f, ...patch })}
            />
          </>
        )}

        {kind === "pack" && (
          <>
            <label>
              Precio del paquete
              <input className="field-in" inputMode="numeric" placeholder="6500" required {...field("price")} />
            </label>
            <label>
              Paquetes en stock <small>(vacío = no se controla)</small>
              <input className="field-in" inputMode="numeric" placeholder="—" {...field("stock")} />
            </label>
          </>
        )}

        {common && (
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
            {!f.by_design && (
              <label>
                Stock <small>(vacío = no se controla)</small>
                <input className="field-in" inputMode="numeric" placeholder="—" {...field("stock")} />
              </label>
            )}
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
        {common && (
          <label className="admin-check wide">
            <input
              type="checkbox"
              checked={f.by_design}
              onChange={(e) => setF({ ...f, by_design: e.target.checked })}
            />
            <span>
              Cada unidad es un diseño distinto <small>(mates artesanales: el cliente elige cuál quiere)</small>
            </span>
          </label>
        )}
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
            {busy ? "Guardando…" : product ? "Guardar cambios" : TITLES[kind][1]}
          </button>
          {note && <span className="muted">{note}</span>}
        </div>
      </form>

      {!product ? (
        <p className="muted">Las fotos{common ? " y los diseños" : ""} se agregan después de crearlo.</p>
      ) : product.by_design ? (
        <DesignManager product={product} onChanged={onChanged} />
      ) : (
        <section className="admin-photos">
          <h3>Fotos</h3>
          <p className="muted">
            La primera es la principal. Con más de una, en la tienda se deslizan. Se achican solas al subirlas.
          </p>
          <PhotoManager product={product} onChanged={onChanged} />
        </section>
      )}
    </div>
  );
}
