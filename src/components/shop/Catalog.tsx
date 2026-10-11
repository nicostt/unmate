"use client";

import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { WhatsAppIcon } from "@/components/site/BrandIcons";
import { reducedMotion, viewTransition } from "@/lib/motion";
import { matches, searchWords, similar } from "@/lib/search";
import { whatsappLink } from "@/lib/site";
import { track } from "@/lib/track";
import type { Design, Product } from "@/lib/types";
import { ProductArt } from "./ProductArt";
import { ProductCard } from "./ProductCard";
import { ProductModal } from "./ProductModal";
import { useShop } from "./ShopProvider";
import { useFlip } from "./useFlip";

type Sort = "rel" | "asc" | "desc" | "az";

// Marca, dentro de los eventos de búsqueda, que la persona tocó el botón de
// WhatsApp del cartel "¿No encontrás lo que buscabas?".
const ASKED = -1;

// Cuánto hay que dejar de escribir para dar la búsqueda por terminada. Recién
// ahí aparece el cartel de "no encontramos nada": mientras se escribe, no.
const PAUSE_MS = 900;

// Nombre que comparten la foto de la tarjeta y la de la ficha mientras una
// se transforma en la otra (ver .m-art en src/styles/catalog.css).
const PHOTO = "ficha-foto";

// Catálogo con filtro por categoría, buscador y orden.
export function Catalog() {
  const { products, categories } = useShop();
  const [category, setCategory] = useState("todos");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("rel");
  // ficha abierta: de qué producto y en qué diseño arrancar
  const [open, setOpen] = useState<{ slug: string; design: Design | null } | null>(null);
  // al filtrar, los productos se deslizan a su lugar nuevo
  const { ref: grid, snapshot } = useFlip<HTMLDivElement>();

  const categoryName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? "";

  // una categoría recién creada, todavía sin productos, no se muestra
  const usedCategories = categories.filter((c) => products.some((p) => p.category === c.slug));

  // Buscador: se busca en el nombre, el material y la categoría, sin tildes
  // ni mayúsculas. Si nada coincide tal cual, se muestran los parecidos (por
  // si hubo un error de tipeo).
  const words = searchWords(query);
  const q = words.join(" ");
  const searchable = (p: Product) => `${p.name} ${p.material ?? ""} ${categoryName(p.category)}`;
  const inCategory = products.filter((p) => category === "todos" || p.category === category);
  const exact = words.length ? inCategory.filter((p) => matches(searchable(p), words)) : inCategory;
  const guessing = words.length > 0 && exact.length === 0;
  const visible: Product[] = guessing ? inCategory.filter((p) => similar(searchable(p), words)) : [...exact];
  if (sort === "asc") visible.sort((a, b) => a.price - b.price);
  if (sort === "desc") visible.sort((a, b) => b.price - a.price);
  if (sort === "az") visible.sort((a, b) => a.name.localeCompare(b.name, "es"));

  // ¿La persona ya terminó de escribir?
  const [settled, setSettled] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setSettled(q), PAUSE_MS);
    return () => clearTimeout(timer);
  }, [q]);
  const typing = settled !== q;

  const openProduct = products.find((p) => p.slug === open?.slug);

  // Estadísticas: se anota qué busca la gente y cuántos resultados encontró
  // (los parecidos no cuentan: si hubo que adivinar, es una búsqueda sin
  // resultado). Se espera a que deje de escribir para no anotar cada letra.
  const found = exact.length;
  useEffect(() => {
    if (q.length < 3) return;
    const timer = setTimeout(() => track("search", { detail: q, value: found }), 1500);
    return () => clearTimeout(timer);
  }, [q, found]);

  // --- abrir y cerrar la ficha: la foto de la tarjeta "viaja" hasta la ficha ---
  // Durante el cambio, la foto de la tarjeta y la de la ficha llevan el mismo
  // view-transition-name, y el navegador transforma una en la otra.
  const photoOf = (slug: string) =>
    reducedMotion()
      ? null
      : (grid.current?.querySelector<HTMLElement>(`[data-flip="${CSS.escape(slug)}"] .card-art`) ?? null);

  function openFicha(slug: string, design: Design | null) {
    const photo = photoOf(slug);
    photo?.style.setProperty("view-transition-name", PHOTO);
    viewTransition(() => {
      photo?.style.removeProperty("view-transition-name"); // en la pantalla nueva el nombre lo lleva la ficha
      flushSync(() => setOpen({ slug, design }));
    });
  }

  function closeFicha() {
    const photo = open ? photoOf(open.slug) : null;
    viewTransition(
      () => {
        flushSync(() => setOpen(null));
        photo?.style.setProperty("view-transition-name", PHOTO);
      },
      () => photo?.style.removeProperty("view-transition-name"),
    );
  }

  return (
    <section className="wrap block" id="catalogo">
      <div className="sec-head">
        <h2>Catálogo</h2>
        <p className="muted" aria-live="polite">
          {guessing ? 0 : visible.length} {!guessing && visible.length === 1 ? "producto" : "productos"}
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
              onClick={() => {
                snapshot();
                setCategory(c.slug);
              }}
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
            onChange={(e) => {
              snapshot();
              setQuery(e.target.value);
            }}
          />
        </label>
        <label className="sort">
          <span className="sr">Ordenar</span>
          <select
            value={sort}
            onChange={(e) => {
              snapshot();
              setSort(e.target.value as Sort);
            }}
          >
            <option value="rel">Orden sugerido</option>
            <option value="asc">Menor precio</option>
            <option value="desc">Mayor precio</option>
            <option value="az">Nombre A–Z</option>
          </select>
        </label>
      </div>

      <div className="grid" ref={grid}>
        {/* no hubo coincidencia exacta, pero hay productos parecidos */}
        {guessing && visible.length > 0 && (
          <p className="grid-note" role="status" data-flip="aviso-parecidos">
            No tenemos nada que se llame <b>“{query.trim()}”</b>. Capaz buscabas esto:
          </p>
        )}

        {visible.map((p) => (
          <ProductCard
            key={p.slug}
            product={p}
            // con parecidos no hay nada que resaltar: lo escrito no figura tal cual
            highlight={guessing ? [] : words}
            onOpen={(design) => openFicha(p.slug, design)}
          />
        ))}

        {/* nada de nada: mientras escribe, un aviso chico; cuando terminó, el cartel */}
        {visible.length === 0 &&
          (typing ? (
            <p className="grid-note muted" role="status" data-flip="aviso-buscando">
              Buscando “{query.trim()}”…
            </p>
          ) : (
            <div className="empty grain" data-flip="aviso-nada">
              <span className="empty-art" aria-hidden="true">
                <ProductArt shape="camionero" />
              </span>
              <strong>¿No encontrás lo que buscabas?</strong>
              <p>
                {query.trim()
                  ? `En la tienda no hay nada con “${query.trim()}”, pero capaz lo conseguimos. `
                  : "Por acá no hay nada todavía. "}
                Contanos qué tenés en mente y te ayudamos a encontrar tu mate ideal. Respondemos al toque.
              </p>
              <a
                className="btn wa big"
                target="_blank"
                rel="noopener"
                // Estadísticas: se anota que alguien preguntó por algo que no encontró.
                // Va como una búsqueda con valor -1 (ver stats-data.ts).
                onClick={() => track("search", { detail: q || "(sin texto)", value: ASKED })}
                href={whatsappLink(
                  query.trim()
                    ? `Hola unmate.es! Estoy buscando "${query.trim()}" y no lo encontré en la tienda. ¿Me ayudan?`
                    : "Hola unmate.es! No encontré lo que buscaba en la tienda. ¿Me ayudan?",
                )}
              >
                <WhatsAppIcon />
                Preguntanos por WhatsApp
              </a>
            </div>
          ))}
      </div>

      {openProduct && <ProductModal product={openProduct} initialDesign={open?.design ?? null} onClose={closeFicha} />}
    </section>
  );
}
