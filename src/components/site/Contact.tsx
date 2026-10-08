import { CONSULTA_LINK, INSTAGRAM_URL, WHATSAPP_DISPLAY } from "@/lib/site";
import { InstagramIcon, WhatsAppIcon } from "./BrandIcons";

export function Contact() {
  return (
    <section className="wrap block" id="contacto" data-reveal>
      <div className="contact">
        <div>
          <p className="eyebrow">Contacto</p>
          <h2>¿Dudas antes de pedir?</h2>
          <p className="muted">
            Escribinos por WhatsApp o por Instagram. Podés pedir fotos, medidas o confirmar si hay stock.
          </p>
        </div>
        <div className="numbox">
          <span className="muted">WhatsApp</span>
          <span className="num">{WHATSAPP_DISPLAY}</span>
          <div className="cta-row">
            <a className="btn wa" href={CONSULTA_LINK} target="_blank" rel="noopener">
              <WhatsAppIcon />
              Abrir WhatsApp
            </a>
            <a className="btn ig" href={INSTAGRAM_URL} target="_blank" rel="noopener">
              <InstagramIcon />
              @unmate.es
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
