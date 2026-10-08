// Estadísticas anónimas de la tienda. Cada navegador recibe un código al azar
// (no es un dato personal) y con él se anotan visitas, productos vistos,
// agregados al carrito y búsquedas. Se guardan en Supabase (funciones `track`
// y `save_cart`, en supabase/migrations/0003_pedidos_disenos_estadisticas.sql)
// y se ven en el panel, pestaña Estadísticas.
//
// Nada de esto puede romper la tienda: si algo falla, se ignora en silencio.

const VISITOR_KEY = "unmate-visitor";
const SESSION_KEY = "unmate-session";

// No se cuenta el movimiento del propio administrador ni el de desarrollo.
function shouldSkip(): boolean {
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") return true;
  // supabase-js guarda la sesión del panel en una clave "sb-...-auth-token"
  return Object.keys(localStorage).some((k) => k.startsWith("sb-") && k.endsWith("-auth-token"));
}

// Código anónimo de este navegador. Se crea la primera vez y se reutiliza.
export function visitorId(): string | null {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return null; // navegación privada sin almacenamiento
  }
}

// De dónde llegó el visitante. Primero se mira ?utm_source= (sirve para
// links propios: unmatees.lat/?utm_source=instagram) y si no, la página anterior.
function source(): string {
  const utm = new URLSearchParams(location.search).get("utm_source");
  if (utm) return utm.toLowerCase().slice(0, 30);
  const from = document.referrer;
  if (!from) return "directo";
  const host = new URL(from).hostname;
  if (host === location.hostname) return "directo";
  if (/instagram/.test(host)) return "instagram";
  if (/whatsapp|wa\.me/.test(host)) return "whatsapp";
  if (/facebook|fb\./.test(host)) return "facebook";
  if (/google/.test(host)) return "google";
  if (/tiktok/.test(host)) return "tiktok";
  return host.replace(/^www\./, "").slice(0, 30);
}

function call(fn: string, body: Record<string, unknown>) {
  fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    keepalive: true, // que salga igual aunque la persona cierre la pestaña
  }).catch(() => {});
}

type EventData = {
  slug?: string; // producto
  design?: number; // diseño
  detail?: string; // texto buscado
  value?: number; // cantidad de resultados de la búsqueda
};

// Anota algo que pasó: "view" (abrió un producto), "add" (lo agregó al
// carrito) o "search" (buscó).
export function track(type: "view" | "add" | "search", data: EventData = {}) {
  try {
    if (shouldSkip()) return;
    const visitor = visitorId();
    if (!visitor) return;
    call("track", {
      p_visitor: visitor,
      p_type: type,
      p_slug: data.slug ?? null,
      p_design: data.design ?? null,
      p_detail: data.detail ?? null,
      p_value: data.value ?? null,
    });
  } catch {}
}

// Anota la visita, una sola vez por sesión del navegador, con el origen y
// el tipo de dispositivo.
export function trackVisit() {
  try {
    if (shouldSkip() || sessionStorage.getItem(SESSION_KEY)) return;
    const visitor = visitorId();
    if (!visitor) return;
    sessionStorage.setItem(SESSION_KEY, "1");
    call("track", {
      p_visitor: visitor,
      p_type: "visit",
      p_source: source(),
      p_device: matchMedia("(pointer: coarse)").matches ? "celular" : "compu",
    });
  } catch {}
}

// Guarda cómo quedó el carrito, para saber cuántos hay sin terminar.
export function saveCart(items: { slug: string; qty: number; design: number | null }[]) {
  try {
    if (shouldSkip()) return;
    const visitor = visitorId();
    if (!visitor) return;
    call("save_cart", { p_visitor: visitor, p_items: items });
  } catch {}
}
