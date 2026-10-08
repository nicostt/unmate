"use client";

import { useEffect, useState } from "react";
import { normalize } from "@/lib/format";
import { whatsappLink } from "@/lib/site";
import { track } from "@/lib/track";
import type { Design, Product } from "@/lib/types";
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
  // ficha abierta: de qué producto y en qué diseño arrancar
  const [open, setOpen] = useState<{ slug: string; design: Design | null } | null>(null);

  const categoryName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? "";

  // una categoría recién creada, todavía sin productos, no se muestra
  const usedCategories = categories.filter((c) => products.some((p) => p.category === c.slug));

  const q = normalize(query.trim());
  const visible: Product[] = products.filter((p) => {
    if (category !== "todos" && p.category !== category) return false;
    if (!q) return true;
    return normalize(`${p.name} ${p.material ?? ""} ${categoryName(p.category)}`).includes(q);
  });
  if (sort === "asc") visible.sort((a, b) => a.price - b.price);
  if (sort === "desc") visible.sort((a, b) => b.price - a.price);
  if (sort === "az") visible.sort((a, b) => a.name.localeCompare(b.name, "es"));

  const openProduct = products.find((p) => p.slug === open?.slug);

  // Estadísticas: se anota qué busca la gente y cuántos resultados encontró.
  // Se espera a que deje de escribir para no anotar cada letra.
  const found = visible.length;
  useEffect(() => {
    if (q.length < 3) return;
    const timer = setTimeout(() => track("search", { detail: q, value: found }), 1500);
    return () => clearTimeout(timer);
  }, [q, found]);

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
          {[{ slug: "todos", name: "Todo" }, ...usedCategories].map((c) => (
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
          visible.map((p) => <ProductCard key={p.slug} product={p} onOpen={(design) => setOpen({ slug: p.slug, design })} />)
        ) : (
          <div className="empty">
            <strong>¿No encontrás lo que buscabas?</strong>
            <p>Escribinos y te ayudamos a encontrar tu mate ideal.</p>
            <a
              className="btn primary"
              target="_blank"
              rel="noopener"
              href={whatsappLink(
                query.trim()
                  ? `Hola unmate.es! Estoy buscando "${query.trim()}" y no lo encontré en la tienda. ¿Me ayudan?`
                  : "Hola unmate.es! No encontré lo que buscaba en la tienda. ¿Me ayudan?",
              )}
            >
              Hablar por WhatsApp
            </a>
          </div>
        )}
      </div>

      {openProduct && (
        <ProductModal product={openProduct} initialDesign={open?.design ?? null} onClose={() => setOpen(null)} />
      )}
    </section>
  );
}
