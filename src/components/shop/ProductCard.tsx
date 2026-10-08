"use client";

import { useState } from "react";
import { discountPercent, money } from "@/lib/format";
import {
  betterDeal,
  cartKey,
  coverImages,
  isSoldOut,
  lineTotal,
  maxQty,
  perKiloLabel,
  stockLabel,
  WEIGHT_STEP,
  weightLabel,
  type Design,
  type Product,
} from "@/lib/types";
import { Gallery } from "./Gallery";
import { ProductArt } from "./ProductArt";
import { useShop } from "./ShopProvider";

// Precio grande + precio anterior tachado + badge de descuento.
export function PriceRow({ price, compareAtPrice }: { price: number; compareAtPrice: number | null }) {
  return (
    <div className="price-row">
      <span className="price">{money(price)}</span>
      {compareAtPrice && (
        <>
          <s className="was">{money(compareAtPrice)}</s>
          <span className="off">−{discountPercent(price, compareAtPrice)}%</span>
        </>
      )}
    </div>
  );
}

// Cantidades de yerba que se ofrecen con un toque; con + y − se sigue de a 250 g.
const QUICK_WEIGHTS = [250, 500, 750, 1000];

// Zona de compra de un producto: precio y botón "Agregar al carrito".
//  - Si va por peso (yerba), antes del botón se elige cuánto llevar y el
//    precio se calcula para esa cantidad.
//  - Si va por diseños, el botón agrega el diseño que se está mirando.
export function BuyBox({
  product,
  design = null,
  small,
  showUnitPrice,
  onAdd,
}: {
  product: Product;
  design?: Design | null; // diseño elegido, si el producto va por diseños
  small?: boolean; // botón más chico, para la tarjeta
  showUnitPrice?: boolean; // mostrar el precio de los productos por unidad
  onAdd: (key: string, amount: number) => void; // amount: unidades, o gramos si va por peso
}) {
  const max = maxQty(product);
  const [chosen, setChosen] = useState(500);
  // si el stock bajó, la cantidad elegida no puede superarlo
  const grams = Math.max(WEIGHT_STEP, Math.min(chosen, Math.floor(max / WEIGHT_STEP) * WEIGHT_STEP));
  const soldOut = isSoldOut(product);
  const deal = product.byWeight ? betterDeal(product, grams) : null;

  const button = (
    <button
      className={small ? "btn primary small" : "btn primary"}
      type="button"
      disabled={soldOut}
      onClick={() => onAdd(cartKey(product, design), product.byWeight ? grams : 1)}
    >
      {soldOut ? "Agotado" : "Agregar al carrito"}
    </button>
  );

  if (!product.byWeight) {
    return (
      <>
        {showUnitPrice && <PriceRow price={product.price} compareAtPrice={product.compareAtPrice} />}
        {button}
      </>
    );
  }

  return (
    <>
      <div className="weight">
        <div className="opts" role="group" aria-label="Cantidad">
          {QUICK_WEIGHTS.map((w) => (
            <button
              key={w}
              className="opt"
              type="button"
              aria-pressed={w === grams}
              disabled={w > max}
              onClick={() => setChosen(w)}
            >
              {weightLabel(w)}
            </button>
          ))}
        </div>
        <div className="qty">
          <button
            type="button"
            disabled={grams <= WEIGHT_STEP}
            onClick={() => setChosen(grams - WEIGHT_STEP)}
            aria-label="250 gramos menos"
          >
            −
          </button>
          <span>{weightLabel(grams)}</span>
          <button
            type="button"
            disabled={grams + WEIGHT_STEP > max}
            onClick={() => setChosen(grams + WEIGHT_STEP)}
            aria-label="250 gramos más"
          >
            +
          </button>
        </div>
      </div>
      <PriceRow
        price={lineTotal(product, grams)}
        compareAtPrice={product.compareAtPrice && Math.round((product.compareAtPrice * grams) / 1000)}
      />
      {/* empujón para llevar más: aparece solo si con más cantidad el kilo sale menos */}
      {deal && (
        <p className="deal">
          Llevando {weightLabel(deal.from)} pagás {money(deal.perKilo)} el kilo
        </p>
      )}
      {button}
    </>
  );
}

export function ProductCard({
  product,
  onOpen,
}: {
  product: Product;
  onOpen: (design: Design | null) => void; // abre la ficha, en el diseño que se estaba mirando
}) {
  const { add, categories } = useShop();
  const categoryName = categories.find((c) => c.slug === product.category)?.name;
  const images = coverImages(product);

  // Con el mouse sobre la foto, las fotos pasan solas; si la persona toca una
  // flecha se frenan, hasta que saque el mouse.
  const [hovering, setHovering] = useState(false);
  const [pinned, setPinned] = useState(false);

  // En un producto por diseños, la foto que está a la vista ES el diseño elegido.
  const [index, setIndex] = useState(0);
  const design = product.byDesign ? (product.designs[index] ?? product.designs[0] ?? null) : null;

  return (
    <article className="card">
      {images.length ? (
        <div
          className="card-art"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => {
            setHovering(false);
            setPinned(false);
          }}
        >
          <Gallery
            images={images}
            alt={product.name}
            sizes="(max-width: 560px) 100vw, 320px"
            playing={hovering && !pinned}
            onManual={() => setPinned(true)}
            onIndexChange={setIndex}
            onOpen={() => onOpen(design)}
          />
          {/* en un mate por diseños: cuál de las piezas se está mirando */}
          {design && product.designs.length > 1 && (
            <span className="card-count">
              {product.designs.indexOf(design) + 1} / {product.designs.length}
            </span>
          )}
        </div>
      ) : (
        // sin fotos todavía: se muestra la ilustración
        <button className="card-art" type="button" onClick={() => onOpen(null)} aria-label={`Ver ${product.name}`}>
          <ProductArt shape={product.shape} />
        </button>
      )}
      <div className="card-body">
        <div className="tags">
          <span className="tag">{product.byWeight ? perKiloLabel(product) : (product.material ?? categoryName)}</span>
          {product.byDesign && <span className="tag">Pieza única</span>}
          {stockLabel(product) && <span className="tag hot">{stockLabel(product)}</span>}
        </div>
        <h3>
          <button type="button" onClick={() => onOpen(design)}>
            {product.name}
          </button>
        </h3>
        <BuyBox product={product} design={design} small showUnitPrice onAdd={add} />
      </div>
    </article>
  );
}
