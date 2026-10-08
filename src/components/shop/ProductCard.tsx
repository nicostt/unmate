"use client";

import { useState } from "react";
import { discountPercent, money } from "@/lib/format";
import type { Product, ProductOption } from "@/lib/types";
import { Gallery } from "./Gallery";
import { ProductArt } from "./ProductArt";
import { useShop } from "./ShopProvider";

// Precio grande + precio anterior tachado + badge de descuento.
export function PriceRow({ option }: { option: ProductOption }) {
  return (
    <div className="price-row">
      <span className="price">{money(option.price)}</span>
      {option.compareAtPrice && (
        <>
          <s className="was">{money(option.compareAtPrice)}</s>
          <span className="off">−{discountPercent(option.price, option.compareAtPrice)}%</span>
        </>
      )}
    </div>
  );
}

// Botoncitos para elegir presentación ("500 g", "1 kg"). Si el producto
// tiene una sola opción no se muestra nada.
export function OptionPicker({
  product,
  selected,
  onSelect,
}: {
  product: Product;
  selected: ProductOption;
  onSelect: (option: ProductOption) => void;
}) {
  if (product.options.length < 2) return null;
  return (
    <div className="opts" role="group" aria-label="Presentación">
      {product.options.map((option) => (
        <button
          key={option.key}
          className="opt"
          type="button"
          aria-pressed={option.key === selected.key}
          onClick={() => onSelect(option)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// Botón de compra: se apaga solo cuando la opción elegida no tiene stock.
export function AddButton({ option, small, onAdd }: { option: ProductOption; small?: boolean; onAdd: () => void }) {
  const soldOut = option.stock === 0;
  return (
    <button className={small ? "btn primary small" : "btn primary"} type="button" disabled={soldOut} onClick={onAdd}>
      {soldOut ? "Sin stock" : "Agregar al carrito"}
    </button>
  );
}

// Guarda qué opción está elegida. Si esa opción desaparece del catálogo
// (por ejemplo, se borró la presentación), vuelve a la primera.
export function useSelectedOption(product: Product) {
  const [key, setKey] = useState(product.options[0].key);
  const selected = product.options.find((o) => o.key === key) ?? product.options[0];
  return [selected, (option: ProductOption) => setKey(option.key)] as const;
}

export function ProductCard({ product, onOpen }: { product: Product; onOpen: () => void }) {
  const { add, categories } = useShop();
  const [option, setOption] = useSelectedOption(product);
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
          {option.stock === 1 && <span className="tag hot">Última unidad</span>}
        </div>
        <h3>
          <button type="button" onClick={onOpen}>
            {product.name}
          </button>
        </h3>
        <OptionPicker product={product} selected={option} onSelect={setOption} />
        <PriceRow option={option} />
        <AddButton option={option} small onAdd={() => add(option.key)} />
      </div>
    </article>
  );
}
