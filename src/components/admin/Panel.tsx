"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { refreshCatalog } from "@/lib/admin-actions";
import { money } from "@/lib/format";
import { PHOTOS_BUCKET, photoUrl, supabase } from "@/lib/supabase";
import { ProductForm } from "./ProductForm";
import { photosOf, type AdminCategory, type AdminProduct } from "./types";

// Trae de la base todo lo que el panel necesita. Con la sesión de admin
// iniciada llegan también los productos ocultos.
async function fetchAll() {
  const [categories, products] = await Promise.all([
    supabase.from("categories").select("id, slug, name").order("sort_order"),
    supabase
      .from("products")
      .select("*, product_media(id, kind, path, sort_order)")
      .order("sort_order"),
  ]);
  const error = categories.error ?? products.error;
  if (error) throw new Error(error.message);
  return { categories: categories.data as AdminCategory[], products: products.data as AdminProduct[] };
}

// Pantalla principal del panel: la lista de productos, o el formulario
// cuando se está creando o editando uno.
export function Panel({ accessToken, email }: { accessToken: string; email: string }) {
  const [data, setData] = useState<{ categories: AdminCategory[]; products: AdminProduct[] }>();
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [error, setError] = useState("");

  const fail = (e: unknown) => setError(e instanceof Error ? e.message : String(e));

  useEffect(() => {
    fetchAll().then(setData, fail);
  }, []);

  // Después de cualquier cambio: avisarle a la web pública y recargar la lista.
  async function changed() {
    await refreshCatalog(accessToken).catch(() => {
      // si el aviso falla no es grave: la web se actualiza sola en unos minutos
    });
    await fetchAll().then(setData, fail);
  }

  // Ejecuta un cambio en la base y muestra el error si lo hay.
  async function run(action: PromiseLike<{ error: { message: string } | null }>) {
    setError("");
    const { error } = await action;
    if (error) setError(error.message);
    await changed();
  }

  async function removeProduct(product: AdminProduct) {
    if (!confirm(`¿Eliminar "${product.name}"? No se puede deshacer.`)) return;
    const paths = product.product_media.map((m) => m.path);
    if (paths.length) await supabase.storage.from(PHOTOS_BUCKET).remove(paths);
    await run(supabase.from("products").delete().eq("id", product.id));
  }

  if (!data) return <p className="admin-msg">{error || "Cargando productos…"}</p>;
  const { categories, products } = data;

  return (
    <div className="wrap admin">
      <header className="admin-head">
        <h1>Panel</h1>
        <span className="muted">{email}</span>
        <a className="btn ghost small" href="/" target="_blank">
          Ver la tienda
        </a>
        <button className="btn ghost small" type="button" onClick={() => supabase.auth.signOut()}>
          Salir
        </button>
      </header>

      {error && <p className="admin-error">{error}</p>}

      {editing !== null ? (
        <ProductForm
          // key: al pasar de "nuevo" al producto recién creado, el formulario arranca de cero
          key={editing}
          product={products.find((p) => p.id === editing) ?? null}
          categories={categories}
          nextSortOrder={Math.max(0, ...products.map((p) => p.sort_order)) + 1}
          onBack={() => setEditing(null)}
          onSaved={async (id) => {
            await changed();
            setEditing(id);
          }}
          onChanged={changed}
        />
      ) : (
        <>
          <div className="admin-bar">
            <p className="muted">
              {products.length} productos · {products.filter((p) => !p.is_active).length} ocultos
            </p>
            <button className="btn primary small" type="button" onClick={() => setEditing("new")}>
              + Agregar producto
            </button>
          </div>
          <div className="admin-list">
            {products.map((p) => (
              <Row
                key={p.id}
                product={p}
                category={categories.find((c) => c.id === p.category_id)?.name ?? ""}
                onEdit={() => setEditing(p.id)}
                onDelete={() => removeProduct(p)}
                onToggle={() =>
                  run(supabase.from("products").update({ is_active: !p.is_active }).eq("id", p.id))
                }
                onStock={(stock) => run(supabase.from("products").update({ stock }).eq("id", p.id))}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Row({
  product,
  category,
  onEdit,
  onDelete,
  onToggle,
  onStock,
}: {
  product: AdminProduct;
  category: string;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onStock: (stock: number | null) => void;
}) {
  const saved = product.stock === null ? "" : String(product.stock);
  const [stock, setStock] = useState(saved);
  const cover = photosOf(product)[0];

  // Guarda el stock al salir del casillero, si cambió. Vacío = sin control de stock.
  function saveStock() {
    const value = stock.trim();
    if (value === saved) return;
    if (value !== "" && !/^\d+$/.test(value)) return setStock(saved);
    onStock(value === "" ? null : Number(value));
  }

  return (
    <div className={product.is_active ? "admin-row" : "admin-row is-hidden"}>
      <div className="admin-thumb">
        {cover && <Image src={photoUrl(cover.path)} alt="" fill sizes="56px" />}
      </div>
      <div className="admin-name">
        <strong>{product.name}</strong>
        <span className="muted">
          {category} · {money(product.price)}
          {!product.is_active && " · oculto"}
        </span>
      </div>
      <label className="admin-stock">
        Stock
        <input
          className="field-in"
          inputMode="numeric"
          placeholder="—"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          onBlur={saveStock}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        />
      </label>
      <div className="admin-actions">
        <button className="btn ghost small" type="button" onClick={onToggle}>
          {product.is_active ? "Ocultar" : "Mostrar"}
        </button>
        <button className="btn ghost small" type="button" onClick={onEdit}>
          Editar
        </button>
        <button className="btn ghost small danger" type="button" onClick={onDelete}>
          Eliminar
        </button>
      </div>
    </div>
  );
}
