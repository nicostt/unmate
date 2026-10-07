"use client";

import { discountPercent, money } from "@/lib/format";
import type { Product } from "@/lib/types";
import { Gallery } from "./Gallery";
import { ProductArt } from "./ProductArt";
import { useShop } from "./ShopProvider";

// Precio grande + precio anterior tachado + badge de descuento.
export function PriceRow({ product }: { product: Product }) {
  return (
    <div className="price-row">
      <span className="price">{money(product.price)}</span>
      {product.compareAtPrice && (
        <>
          <s className="was">{money(product.compareAtPrice)}</s>
          <span className="off">−{discountPercent(product.price, product.compareAtPrice)}%</span>
        </>
      )}
    </div>
  );
}

export function ProductCard({ product, onOpen }: { product: Product; onOpen: () => void }) {
  const { add, categories } = useShop();
  const categoryName = categories.find((c) => c.slug === product.category)?.name;

  return (
    <article className="card">
      {product.images.length ? (
        <div className="card-art">
          <Gallery
            images={product.images}
            alt={product.name}
            sizes="(max-width: 560px) 100vw, 320px"
            onOpen={onOpen}
          />
        </div>
      ) : (
        // sin fotos todavía: se muestra la ilustración
        <button className="card-art" type="button" onClick={onOpen} aria-label={`Ver ${product.name}`}>
          <ProductArt shape={product.shape} />
        </button>
      )}
      <div className="card-body">
        <div className="tags">
          <span className="tag">{product.material ?? categoryName}</span>
          {product.stock === 1 && <span className="tag hot">Última unidad</span>}
        </div>
        <h3>
          <button type="button" onClick={onOpen}>
            {product.name}
          </button>
        </h3>
        <PriceRow product={product} />
        <button className="btn primary small" type="button" onClick={() => add(product.slug)}>
          Agregar al carrito
        </button>
      </div>
    </article>
  );
}
