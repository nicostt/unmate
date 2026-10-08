"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { refreshCatalog } from "@/lib/admin-actions";
import { money } from "@/lib/format";
import { PHOTOS_BUCKET, photoUrl, supabase } from "@/lib/supabase";
import { WEIGHT_CATEGORY } from "@/lib/types";
import { CategoryManager } from "./CategoryManager";
import { ProductForm } from "./ProductForm";
import {
  gramsToKilos,
  kilosToGrams,
  photosOf,
  toInt,
  type AdminCategory,
  type AdminProduct,
} from "./types";

// Trae de la base todo lo que el panel necesita. Con la sesión de admin
// iniciada llegan también los productos ocultos.
async function fetchAll() {
  const [categories, products] = await Promise.all([
    supabase.from("categories").select("id, slug, name, sort_order").order("sort_order"),
    supabase
      .from("products")
      .select("*, product_media(id, kind, path, sort_order)")
      .order("sort_order"),
  ]);
  const error = categories.error ?? products.error;
  if (error) throw new Error(error.message);
  return { categories: categories.data as AdminCategory[], products: products.data as AdminProduct[] };
}

// Qué se está mostrando: la lista, las categorías, o el formulario de un
// producto o de una yerba (nuevo, o el que tiene ese id).
type View =
  | { screen: "list" }
  | { screen: "categories" }
  | { screen: "form"; kind: "product" | "yerba"; id: number | null };

// Pantalla principal del panel.
export function Panel({ accessToken, email }: { accessToken: string; email: string }) {
  const [data, setData] = useState<{ categories: AdminCategory[]; products: AdminProduct[] }>();
  const [view, setView] = useState<View>({ screen: "list" });
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

  // La yerba vive en su propia categoría. Si todavía no existe, se crea sola
  // la primera vez que se va a cargar una yerba.
  async function newYerba() {
    if (!data?.categories.some((c) => c.slug === WEIGHT_CATEGORY)) {
      const sort_order = Math.max(0, ...(data?.categories.map((c) => c.sort_order) ?? [])) + 1;
      await run(supabase.from("categories").insert({ slug: WEIGHT_CATEGORY, name: "Yerba", sort_order }));
    }
    setView({ screen: "form", kind: "yerba", id: null });
  }

  if (!data) return <p className="admin-msg">{error || "Cargando productos…"}</p>;
  const { categories, products } = data;

  const yerbaCategory = categories.find((c) => c.slug === WEIGHT_CATEGORY);
  const yerbas = products.filter((p) => p.category_id === yerbaCategory?.id);
  const others = products.filter((p) => p.category_id !== yerbaCategory?.id);

  const rows = (list: AdminProduct[], kind: "product" | "yerba") =>
    list.map((p) => (
      <Row
        key={p.id}
        product={p}
        byWeight={kind === "yerba"}
        category={categories.find((c) => c.id === p.category_id)?.name ?? ""}
        onEdit={() => setView({ screen: "form", kind, id: p.id })}
        onDelete={() => removeProduct(p)}
        onToggle={() => run(supabase.from("products").update({ is_active: !p.is_active }).eq("id", p.id))}
        onStock={(stock) => run(supabase.from("products").update({ stock }).eq("id", p.id))}
      />
    ));

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

      {view.screen === "categories" && (
        <CategoryManager
          categories={categories}
          products={products}
          onBack={() => setView({ screen: "list" })}
          onChanged={changed}
        />
      )}

      {view.screen === "form" && (
        <ProductForm
          // key: al pasar de "nuevo" al producto recién creado, el formulario arranca de cero
          key={`${view.kind}-${view.id}`}
          kind={view.kind}
          product={products.find((p) => p.id === view.id) ?? null}
          // la yerba tiene su propia sección: no se ofrece como categoría de un producto común
          categories={view.kind === "yerba" ? categories : categories.filter((c) => c.id !== yerbaCategory?.id)}
          yerbaCategoryId={yerbaCategory?.id}
          nextSortOrder={Math.max(0, ...products.map((p) => p.sort_order)) + 1}
          onBack={() => setView({ screen: "list" })}
          onSaved={async (id) => {
            await changed();
            setView({ screen: "form", kind: view.kind, id });
          }}
          onChanged={changed}
        />
      )}

      {view.screen === "list" && (
        <>
          <section className="admin-section">
            <div className="admin-bar">
              <h2>Productos</h2>
              <p className="muted">
                {others.length} · {others.filter((p) => !p.is_active).length} ocultos
              </p>
              <button className="btn ghost small" type="button" onClick={() => setView({ screen: "categories" })}>
                Categorías
              </button>
              <button
                className="btn primary small"
                type="button"
                onClick={() => setView({ screen: "form", kind: "product", id: null })}
              >
                + Agregar producto
              </button>
            </div>
            <div className="admin-list">{rows(others, "product")}</div>
          </section>

          <section className="admin-section">
            <div className="admin-bar">
              <h2>Yerba</h2>
              <p className="muted">Se vende por peso, de a 250 g. Cargás el precio del kilo y cuántos kilos hay.</p>
              <button className="btn primary small" type="button" onClick={newYerba}>
                + Agregar yerba
              </button>
            </div>
            <div className="admin-list">
              {yerbas.length ? rows(yerbas, "yerba") : <p className="muted">Todavía no cargaste ninguna yerba.</p>}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Row({
  product,
  byWeight,
  category,
  onEdit,
  onDelete,
  onToggle,
  onStock,
}: {
  product: AdminProduct;
  byWeight: boolean;
  category: string;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onStock: (stock: number | null) => void;
}) {
  // El casillero muestra unidades, o kilos si es yerba (en la base van gramos).
  const saved = byWeight ? gramsToKilos(product.stock) : product.stock === null ? "" : String(product.stock);
  const [stock, setStock] = useState(saved);
  const cover = photosOf(product)[0];

  // Guarda el stock al salir del casillero, si cambió. Vacío = sin control de stock.
  function saveStock() {
    if (stock.trim() === saved) return;
    const value = byWeight ? kilosToGrams(stock) : toInt(stock);
    if (Number.isNaN(value)) return setStock(saved);
    onStock(value);
  }

  return (
    <div className={product.is_active ? "admin-row" : "admin-row is-hidden"}>
      <div className="admin-thumb">
        {cover && <Image src={photoUrl(cover.path)} alt="" fill sizes="56px" />}
      </div>
      <div className="admin-name">
        <strong>{product.name}</strong>
        <span className="muted">
          {byWeight ? `${money(product.price)} el kg` : `${category} · ${money(product.price)}`}
          {!product.is_active && " · oculto"}
        </span>
      </div>
      <label className="admin-stock">
        {byWeight ? "Kilos" : "Stock"}
        <input
          className="field-in"
          inputMode={byWeight ? "decimal" : "numeric"}
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
