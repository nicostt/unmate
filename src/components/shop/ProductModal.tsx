"use client";

import { whatsappLink } from "@/lib/site";
import type { Product } from "@/lib/types";
import { Gallery } from "./Gallery";
import { ProductArt } from "./ProductArt";
import { PriceRow } from "./ProductCard";
import { useShop } from "./ShopProvider";
import { useOverlay } from "./useOverlay";

// Ficha de producto: se abre encima del catálogo al tocar una tarjeta.
export function ProductModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { add, openCart, categories } = useShop();
  useOverlay(true, onClose);

  const categoryName = categories.find((c) => c.slug === product.category)?.name;

  function addAndGoToCart() {
    if (add(product.slug)) {
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
        {product.images.length ? (
          <div className="m-art has-photos">
            <Gallery images={product.images} alt={product.name} sizes="(max-width: 700px) 100vw, 390px" />
          </div>
        ) : (
          <div className="m-art">
            <ProductArt shape={product.shape} />
          </div>
        )}
        <div className="m-info">
          <p className="eyebrow">{categoryName}</p>
          <h3 id="m-title">{product.name}</h3>
          <PriceRow product={product} />
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
            {product.stock === 1 && (
              <div>
                <dt>Disponibilidad</dt>
                <dd>Última unidad</dd>
              </div>
            )}
          </dl>
          <div className="m-actions">
            <button className="btn primary" type="button" onClick={addAndGoToCart}>
              Agregar al carrito
            </button>
            <a
              className="btn ghost"
              target="_blank"
              rel="noopener"
              href={whatsappLink(`Hola unmate.es! Quiero ver más fotos de: ${product.name}`)}
            >
              Pedir fotos por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
