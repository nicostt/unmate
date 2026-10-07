"use client";

import { discountPercent, money } from "@/lib/format";
import type { Product } from "@/lib/types";
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
      <button className="card-art" type="button" onClick={onOpen} aria-label={`Ver ${product.name}`}>
        <ProductArt shape={product.shape} />
      </button>
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
