"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { whatsappLink } from "@/lib/site";
import { track } from "@/lib/track";
import { perKiloLabel, productLabel, type Design, type Product } from "@/lib/types";
import { Gallery } from "./Gallery";
import { ProductArt } from "./ProductArt";
import { BuyBox, PriceRow } from "./ProductCard";
import { useShop } from "./ShopProvider";
import { useOverlay } from "./useOverlay";

// Ficha de producto: se abre encima del catálogo al tocar una tarjeta.
// En un producto por diseños muestra las fotos del diseño elegido (la
// principal y sus otros ángulos) y, abajo, una tira para cambiar de diseño.
export function ProductModal({
  product,
  initialDesign,
  onClose,
}: {
  product: Product;
  initialDesign: Design | null; // el diseño que se estaba mirando en la tarjeta
  onClose: () => void;
}) {
  const { add, openCart, categories } = useShop();
  const [designId, setDesignId] = useState(initialDesign?.id);
  useOverlay(true, onClose);

  // si ese diseño dejó de existir mientras la ficha estaba abierta, se usa el primero
  const design = product.byDesign
    ? (product.designs.find((d) => d.id === designId) ?? product.designs[0] ?? null)
    : null;
  const images = design ? design.images : product.images;
  const categoryName = categories.find((c) => c.slug === product.category)?.name;

  // Estadísticas: se anota que alguien abrió este producto (y qué diseño miró).
  useEffect(() => {
    track("view", { slug: product.slug, design: design?.id });
  }, [product.slug, design?.id]);

  function addAndGoToCart(key: string, amount: number) {
    if (add(key, amount)) {
      onClose();
      openCart();
    }
  }

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="m-title"
      // clic en el fondo oscuro (y no en la ficha) = cerrar
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-card">
        <button className="icon-btn" type="button" onClick={onClose} aria-label="Cerrar" autoFocus>
          ×
        </button>
        {images.length ? (
          <div className="m-art has-photos">
            {/* key: al cambiar de diseño la galería arranca en su primera foto */}
            <Gallery
              key={design?.id ?? "general"}
              images={images}
              alt={productLabel(product, design)}
              sizes="(max-width: 700px) 100vw, 390px"
            />
          </div>
        ) : (
          <div className="m-art">
            <ProductArt shape={product.shape} />
          </div>
        )}
        <div className="m-info">
          <p className="eyebrow">{categoryName}</p>
          <h3 id="m-title">{product.name}</h3>
          {/* la yerba muestra su precio abajo, según la cantidad elegida */}
          {!product.byWeight && <PriceRow price={product.price} compareAtPrice={product.compareAtPrice} />}

          {design && product.designs.length > 1 && (
            <div className="design-picker">
              <p className="muted">Cada pieza es única. Elegí tu diseño:</p>
              <div className="design-thumbs">
                {product.designs.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    aria-pressed={d.id === design.id}
                    aria-label={`Diseño #${d.number}`}
                    onClick={() => setDesignId(d.id)}
                  >
                    <Image src={d.images[0]} alt="" fill sizes="64px" />
                    <span>#{d.number}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="muted">
            {product.description ?? "Escribinos y te pasamos fotos, medidas y detalles de este producto."}
          </p>
          <dl>
            <div>
              <dt>Categoría</dt>
              <dd>{categoryName}</dd>
            </div>
            {product.material && (
              <div>
                <dt>Material</dt>
                <dd>{product.material}</dd>
              </div>
            )}
            {product.byWeight && (
              <div>
                <dt>Precio</dt>
                <dd>{perKiloLabel(product)}</dd>
              </div>
            )}
            {design && (
              <div>
                <dt>Diseño elegido</dt>
                <dd>#{design.number}</dd>
              </div>
            )}
            {!product.byWeight && !product.byDesign && product.stock === 1 && (
              <div>
                <dt>Disponibilidad</dt>
                <dd>Última unidad</dd>
              </div>
            )}
          </dl>
          <div className="m-actions">
            <BuyBox product={product} design={design} onAdd={addAndGoToCart} />
            <a
              className="btn ghost"
              target="_blank"
              rel="noopener"
              href={whatsappLink(`Hola unmate.es! Quiero ver más fotos de: ${productLabel(product, design)}`)}
            >
              Pedir fotos por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
