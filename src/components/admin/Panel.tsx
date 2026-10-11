"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { refreshCatalog } from "@/lib/admin-actions";
import { money } from "@/lib/format";
import { PHOTOS_BUCKET, photoUrl, supabase } from "@/lib/supabase";
import { YERBA_CATEGORY } from "@/lib/types";
import { CategoryManager } from "./CategoryManager";
import { HoldButton } from "./HoldButton";
import { KitDiscountForm } from "./KitDiscountForm";
import { Orders } from "./Orders";
import { ReviewsAdmin } from "./ReviewsAdmin";
import { SortableList } from "./SortableList";
import { Stats } from "./Stats";
import { ProductForm, type FormKind } from "./ProductForm";
import {
  coverOf,
  gramsToKilos,
  kilosToGrams,
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
      .select("*, product_media(id, kind, path, sort_order, design_id), product_designs(*)")
      .order("sort_order"),
  ]);
  const error = categories.error ?? products.error;
  if (error) throw new Error(error.message);
  return { categories: categories.data as AdminCategory[], products: products.data as AdminProduct[] };
}

// Qué se está mostrando: una de las pestañas, las categorías, o el
// formulario de un producto o de una yerba (nuevo, o el que tiene ese id).
type View =
  | { screen: "list" }
  | { screen: "yerba" }
  | { screen: "orders" }
  | { screen: "sold" }
  | { screen: "stats" }
  | { screen: "reviews" }
  | { screen: "categories" }
  | { screen: "form"; kind: FormKind; id: number | null };

// Pestañas del panel, en el orden en que se muestran.
const TABS = [
  ["list", "Productos"],
  ["yerba", "Yerba"],
  ["orders", "Pedidos"],
  ["sold", "Vendidos"],
  ["stats", "Estadísticas"],
  ["reviews", "Reseñas"],
] as const;

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
    const paths = product.product_media.map((m) => m.path);
    if (paths.length) await supabase.storage.from(PHOTOS_BUCKET).remove(paths);
    await run(supabase.from("products").delete().eq("id", product.id));
  }

  // La yerba vive en su propia categoría. Si todavía no existe, se crea sola
  // la primera vez que se va a cargar una yerba.
  async function newYerba(kind: "yerba" | "pack") {
    if (!data?.categories.some((c) => c.slug === YERBA_CATEGORY)) {
      const sort_order = Math.max(0, ...(data?.categories.map((c) => c.sort_order) ?? [])) + 1;
      await run(supabase.from("categories").insert({ slug: YERBA_CATEGORY, name: "Yerba", sort_order }));
    }
    setView({ screen: "form", kind, id: null });
  }

  if (!data) return <p className="admin-msg">{error || "Cargando productos…"}</p>;
  const { categories, products } = data;

  const yerbaCategory = categories.find((c) => c.slug === YERBA_CATEGORY);
  const inYerba = products.filter((p) => p.category_id === yerbaCategory?.id);
  const loose = inYerba.filter((p) => p.by_weight); // yerba suelta, por peso
  const packs = inYerba.filter((p) => !p.by_weight); // paquetes, por unidad
  const others = products.filter((p) => p.category_id !== yerbaCategory?.id);

  // Lleva un producto de una posición a otra dentro de su lista (lo llama
  // SortableList al soltar una fila). Los números de orden de esa lista se
  // reparten de nuevo en la secuencia nueva, así no cambia cómo se
  // intercalan productos y yerbas en la tienda.
  async function move(list: AdminProduct[], from: number, to: number) {
    const slots = list.map((p) => p.sort_order);
    const next = [...list];
    next.splice(to, 0, ...next.splice(from, 1));
    const order = new Map(next.map((product, i) => [product.id, slots[i]]));

    // primero en pantalla, para que la fila no vuelva a su lugar mientras se guarda
    setData({
      categories,
      products: products
        .map((p) => ({ ...p, sort_order: order.get(p.id) ?? p.sort_order }))
        .sort((a, b) => a.sort_order - b.sort_order),
    });

    setError("");
    for (const product of next) {
      if (product.sort_order === order.get(product.id)) continue;
      const { error } = await supabase
        .from("products")
        .update({ sort_order: order.get(product.id) })
        .eq("id", product.id);
      if (error) setError(error.message);
    }
    await changed();
  }

  // Una lista de productos que se ordena arrastrando cada fila de su manija.
  const rows = (list: AdminProduct[], kind: FormKind) => (
    <SortableList onMove={(from, to) => move(list, from, to)}>
      {list.map((p) => (
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
      ))}
    </SortableList>
  );

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

      {TABS.some(([screen]) => screen === view.screen) && (
        <nav className="chips" aria-label="Secciones del panel">
          {TABS.map(([screen, label]) => (
            <button
              key={screen}
              className="chip"
              type="button"
              aria-pressed={view.screen === screen}
              onClick={() => setView({ screen })}
            >
              {label}
            </button>
          ))}
        </nav>
      )}

      {error && <p className="admin-error">{error}</p>}

      {/* key: al cambiar de pestaña el listado arranca de nuevo */}
      {view.screen === "orders" && <Orders key="open" mode="open" onStockChanged={changed} />}

      {view.screen === "sold" && <Orders key="sold" mode="sold" onStockChanged={changed} />}

      {view.screen === "stats" && <Stats products={products} />}

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
          categories={categories.filter((c) => c.id !== yerbaCategory?.id)}
          yerbaCategoryId={yerbaCategory?.id}
          nextSortOrder={Math.max(0, ...products.map((p) => p.sort_order)) + 1}
          onBack={() => setView({ screen: view.kind === "product" ? "list" : "yerba" })}
          onSaved={async (id) => {
            await changed();
            setView({ screen: "form", kind: view.kind, id });
          }}
          onChanged={changed}
        />
      )}

      {view.screen === "reviews" && <ReviewsAdmin onChanged={changed} />}

      {view.screen === "list" && (
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
          {rows(others, "product")}
        </section>
      )}

      {view.screen === "list" && <KitDiscountForm onChanged={changed} />}

      {view.screen === "yerba" && (
        <>
          <section className="admin-section">
            <div className="admin-bar">
              <h2>Yerba suelta</h2>
              <p className="muted">
                Por peso, de a 250 g. En Editar cargás el precio del kilo, los kilos y cuánto cambia según la cantidad.
              </p>
              <button className="btn primary small" type="button" onClick={() => newYerba("yerba")}>
                + Agregar yerba suelta
              </button>
            </div>
            {loose.length ? rows(loose, "yerba") : <p className="muted">Todavía no cargaste yerba suelta.</p>}
          </section>

          <section className="admin-section">
            <div className="admin-bar">
              <h2>Paquetes</h2>
              <p className="muted">Yerba ya envasada, que se vende por unidad: un paquete de 500 g, de 1 kg, etc.</p>
              <button className="btn primary small" type="button" onClick={() => newYerba("pack")}>
                + Agregar paquete
              </button>
            </div>
            {packs.length ? rows(packs, "pack") : <p className="muted">Todavía no cargaste paquetes.</p>}
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
  const cover = coverOf(product);

  // Guarda el stock al salir del casillero, si cambió. Vacío = sin control de stock.
  function saveStock() {
    if (stock.trim() === saved) return;
    const value = byWeight ? kilosToGrams(stock) : toInt(stock);
    if (Number.isNaN(value)) return setStock(saved);
    onStock(value);
  }

  return (
    <div className={product.is_active ? "admin-row" : "admin-row is-hidden"}>
      {/* manija para ordenar: el arrastre lo maneja SortableList */}
      <button
        className="admin-grip"
        type="button"
        aria-label={`Mover ${product.name}: arrastrá, o usá las flechas arriba y abajo`}
        title="Arrastrá para cambiar el orden"
      >
        ⠿
      </button>
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
      {product.by_design ? (
        // el stock de un producto por diseños es la cantidad de diseños (se cargan en Editar)
        <span className="admin-stock">
          Diseños
          <strong>{product.product_designs.length}</strong>
        </span>
      ) : (
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
      )}
      <div className="admin-actions">
        <button className="btn ghost small" type="button" onClick={onToggle}>
          {product.is_active ? "Ocultar" : "Mostrar"}
        </button>
        <button className="btn ghost small" type="button" onClick={onEdit}>
          Editar
        </button>
        <HoldButton onConfirm={onDelete} title="Mantené apretado para eliminar. No se puede deshacer.">
          Eliminar
        </HoldButton>
      </div>
    </div>
  );
}
