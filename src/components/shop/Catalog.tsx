"use client";

import { useState } from "react";
import { normalize } from "@/lib/format";
import type { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { ProductModal } from "./ProductModal";
import { useShop } from "./ShopProvider";

type Sort = "rel" | "asc" | "desc" | "az";

// Catálogo con filtro por categoría, buscador y orden.
export function Catalog() {
  const { products, categories } = useShop();
  const [category, setCategory] = useState("todos");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("rel");
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const categoryName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? "";

  const q = normalize(query.trim());
  const visible: Product[] = products.filter((p) => {
    if (category !== "todos" && p.category !== category) return false;
    if (!q) return true;
    return normalize(`${p.name} ${p.material ?? ""} ${categoryName(p.category)}`).includes(q);
  });
  if (sort === "asc") visible.sort((a, b) => a.price - b.price);
  if (sort === "desc") visible.sort((a, b) => b.price - a.price);
  if (sort === "az") visible.sort((a, b) => a.name.localeCompare(b.name, "es"));

  const openProduct = products.find((p) => p.slug === openSlug);

  return (
    <section className="wrap block" id="catalogo">
      <div className="sec-head">
        <h2>Catálogo</h2>
        <p className="muted" aria-live="polite">
          {visible.length} {visible.length === 1 ? "producto" : "productos"}
        </p>
      </div>

      <div className="toolbar">
        <div className="chips" role="group" aria-label="Categorías">
          {[{ slug: "todos", name: "Todo" }, ...categories].map((c) => (
            <button
              key={c.slug}
              className="chip"
              type="button"
              aria-pressed={category === c.slug}
              onClick={() => setCategory(c.slug)}
            >
              {c.name}
            </button>
          ))}
        </div>
        <label className="search">
          <span className="sr">Buscar productos</span>
          <input
            type="search"
            placeholder="Buscar: camionero, pico loro, algarrobo…"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className="sort">
          <span className="sr">Ordenar</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="rel">Orden sugerido</option>
            <option value="asc">Menor precio</option>
            <option value="desc">Mayor precio</option>
            <option value="az">Nombre A–Z</option>
          </select>
        </label>
      </div>

      <div className="grid">
        {visible.length ? (
          visible.map((p) => <ProductCard key={p.slug} product={p} onOpen={() => setOpenSlug(p.slug)} />)
        ) : (
          <p className="empty">
            No encontramos productos con esa búsqueda. Probá con otra palabra o escribinos por WhatsApp.
          </p>
        )}
      </div>

      {openProduct && <ProductModal product={openProduct} onClose={() => setOpenSlug(null)} />}
    </section>
  );
}
