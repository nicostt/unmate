"use client";

import { useEffect, useState } from "react";
import { money } from "@/lib/format";
import { compute, fetchRaw, type Bar, type Raw } from "./stats-data";
import type { AdminProduct } from "./types";

const PERIODS = [
  [7, "7 días"],
  [30, "30 días"],
  [90, "90 días"],
] as const;

// Estadísticas de la tienda: cuánta gente entra, qué mira, qué deja en el
// carrito y qué termina pidiendo. Los datos son anónimos y se juntan desde
// que se activó el seguimiento (ver src/lib/track.ts).
export function Stats({ products }: { products: AdminProduct[] }) {
  const [days, setDays] = useState<number>(30);
  const [loaded, setLoaded] = useState<{ days: number; raw: Raw }>();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchRaw(days).then(
      (raw) => !cancelled && setLoaded({ days, raw }),
      (e) => !cancelled && setError(e instanceof Error ? e.message : String(e)),
    );
    return () => {
      cancelled = true;
    };
  }, [days]);

  if (error) return <p className="admin-error">{error}</p>;
  if (!loaded || loaded.days !== days) return <p className="admin-msg">Calculando estadísticas…</p>;

  const s = compute(loaded.raw, products, days);
  const entered = s.funnel[0].value;

  return (
    <section className="stats">
      <div className="chips" role="group" aria-label="Período">
        {PERIODS.map(([value, label]) => (
          <button key={value} className="chip" type="button" aria-pressed={days === value} onClick={() => setDays(value)}>
            Últimos {label}
          </button>
        ))}
      </div>

      {s.empty ? (
        <p className="muted">
          Todavía no hay datos en este período. Empiezan a juntarse solos a medida que la gente entra a la tienda
          publicada. Tus propias visitas (con la sesión del panel iniciada) no se cuentan.
        </p>
      ) : (
        <>
          <div className="stat-tiles">
            <Tile label="Personas que entraron" value={s.visitors} />
            <Tile label="Pedidos enviados" value={s.ordersSent} hint={`${s.ordersConfirmed} confirmados`} />
            <Tile label="Vendido (confirmado)" value={money(s.revenue)} hint={`Ticket promedio ${money(s.averageTicket)}`} />
            <Tile
              label="Carritos sin terminar"
              value={s.openCarts}
              hint={s.openCarts ? `Suman ${money(s.cartsValue)}` : "en la última semana"}
            />
          </div>

          <Block title="El recorrido" help="De todos los que entraron, cuántos llegaron a cada paso. Donde la barra cae fuerte es donde se te va la gente.">
            <BarList bars={s.funnel.map((b) => ({ ...b, note: entered ? `${Math.round((b.value / entered) * 100)}%` : "" }))} unit="personas" />
          </Block>

          <Block title="Personas por día" help="Cuántas personas distintas entraron cada día.">
            <Columns bars={s.perDay} unit="personas" every={Math.ceil(days / 10)} />
          </Block>

          <div className="stat-grid">
            <Block title="Interés sin compra" help="Productos que varios agregaron al carrito pero casi nadie pidió. Vale la pena revisar su precio, sus fotos o su descripción.">
              <BarList bars={s.wanted} unit="personas que no lo pidieron" empty="Nada para marcar todavía." />
            </Block>
            <Block title="Qué hay en los carritos sin terminar" help="Lo que la gente dejó en el carrito en la última semana y todavía no pidió.">
              <BarList bars={s.inCarts} unit="carritos" empty="No hay carritos sin terminar." />
            </Block>
          </div>

          <Block title="Productos: quién los mira, quién los agrega, quién los pide" help="Cuenta personas distintas: si alguien agrega 30 veces el mismo mate, vale por una.">
            {s.productRows.length ? (
              <div className="stat-table-wrap">
                <table className="stat-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Lo vieron</th>
                      <th>Lo agregaron</th>
                      <th>Lo pidieron</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.productRows.map((r) => (
                      <tr key={r.name}>
                        <td>
                          {r.name}
                          {r.soldOut && <span className="admin-status"> sin stock</span>}
                        </td>
                        <td>{r.viewers}</td>
                        <td>{r.adders}</td>
                        <td>{r.buyers}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted">Todavía nadie abrió ni agregó productos.</p>
            )}
          </Block>

          <div className="stat-grid">
            <Block title="Diseños más elegidos" help="Los diseños puntuales que más personas agregaron al carrito. Te dice qué estilos gustan.">
              <BarList bars={s.designs} unit="personas" empty="Todavía nadie eligió un diseño." />
            </Block>
            <Block title="Agotados que siguen mirando" help="Productos sin stock que la gente igual abre. Candidatos a reponer.">
              <BarList bars={s.soldOutWanted} unit="personas" empty="Ningún agotado con visitas." />
            </Block>
          </div>

          <div className="stat-grid">
            <Block title="Buscan y no encuentran" help="Lo que escribieron en el buscador y no dio ningún resultado: te lo están pidiendo y no lo tenés (o está con otro nombre).">
              <BarList bars={s.missedSearches} unit="personas" empty="Todas las búsquedas encontraron algo." />
            </Block>
            <Block title="Lo que más buscan" help="Búsquedas que sí encontraron productos.">
              <BarList bars={s.topSearches} unit="personas" empty="Todavía nadie usó el buscador." />
            </Block>
          </div>

          <div className="stat-grid">
            <Block title="De dónde llegan" help='Si compartís links con "?utm_source=instagram" al final, acá vas a ver exactamente cuál trajo gente.'>
              <BarList bars={s.sources} unit="personas" />
            </Block>
            <Block title="Celular o compu" help="Con qué entran a la tienda.">
              <BarList bars={s.devices} unit="personas" />
            </Block>
          </div>

          <div className="stat-grid">
            <Block title="A qué hora entran" help="Sirve para elegir cuándo publicar en Instagram.">
              <Columns bars={s.hours} unit="personas" every={3} />
            </Block>
            <Block title="Qué días entran" help="Personas por día de la semana.">
              <BarList bars={s.weekdays} unit="personas" />
            </Block>
          </div>

          <Block title="Más vendidos" help="Unidades en pedidos confirmados o entregados. La yerba cuenta una vez por pedido.">
            <BarList bars={s.bestSellers} unit="vendidos" empty="Todavía no hay pedidos confirmados en este período." />
          </Block>
        </>
      )}
    </section>
  );
}

// Número grande con su título.
function Tile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="stat-tile">
      <span className="muted">{label}</span>
      <strong>{value}</strong>
      {hint && <small className="muted">{hint}</small>}
    </div>
  );
}

function Block({ title, help, children }: { title: string; help: string; children: React.ReactNode }) {
  return (
    <article className="stat-block">
      <h3>{title}</h3>
      <p className="muted">{help}</p>
      {children}
    </article>
  );
}

// Barras horizontales: una por renglón, con su nombre y su valor escritos.
function BarList({ bars, unit, empty }: { bars: Bar[]; unit: string; empty?: string }) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  if (!bars.length) return <p className="muted">{empty ?? "Sin datos todavía."}</p>;
  return (
    <ul className="stat-bars">
      {bars.map((bar) => (
        <li key={bar.label} title={`${bar.label}: ${bar.value} ${unit}${bar.note ? ` (${bar.note})` : ""}`}>
          <span className="stat-bar-label">{bar.label}</span>
          <span className="stat-bar-track">
            <span className="stat-bar-fill" style={{ width: `${(bar.value / max) * 100}%` }} />
          </span>
          <span className="stat-bar-value">
            {bar.value}
            {bar.note && <small className="muted"> {bar.note}</small>}
          </span>
        </li>
      ))}
    </ul>
  );
}

// Barras verticales para series en el tiempo (días, horas). `every` indica
// cada cuántas barras se escribe la etiqueta de abajo, para que no se pisen.
function Columns({ bars, unit, every }: { bars: Bar[]; unit: string; every: number }) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  return (
    <div className="stat-columns" role="img" aria-label={bars.map((b) => `${b.label}: ${b.value}`).join(", ")}>
      {bars.map((bar, i) => (
        <div key={bar.label} className="stat-column" title={`${bar.label}: ${bar.value} ${unit}`}>
          <span className="stat-column-value">{bar.value || ""}</span>
          <span className="stat-column-fill" style={{ height: `${(bar.value / max) * 100}%` }} />
          <span className="stat-column-label">{i % every === 0 ? bar.label : ""}</span>
        </div>
      ))}
    </div>
  );
}
