import Image from "next/image";
import type { Review } from "@/lib/types";

// Reseñas de clientes. Se cargan desde el panel (pestaña Reseñas). Si no hay
// ninguna, la sección directamente no aparece.
export function Reviews({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;

  return (
    <section className="wrap block" id="resenas">
      <div className="sec-head">
        <div>
          <p className="eyebrow">Reseñas</p>
          <h2>Ya toman mate con nosotros</h2>
        </div>
      </div>
      <div className="reviews">
        {reviews.map((review) => (
          <figure className="review" key={review.id}>
            {review.photos.length > 0 && (
              <div className={review.photos.length > 1 ? "review-photos many" : "review-photos"}>
                {review.photos.map((src, i) => (
                  <div key={src}>
                    <Image
                      src={src}
                      alt={`Foto que nos mandó ${review.name}${review.photos.length > 1 ? ` (${i + 1})` : ""}`}
                      fill
                      sizes="(max-width: 560px) 90vw, 340px"
                    />
                  </div>
                ))}
              </div>
            )}
            {review.text && <blockquote>{review.text}</blockquote>}
            <figcaption>
              <span className="review-avatar" aria-hidden="true">
                {review.name.trim().charAt(0).toUpperCase()}
              </span>
              {review.name}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
