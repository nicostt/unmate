"use client";

import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Login } from "./Login";
import { Panel } from "./Panel";

// Puerta de entrada del panel: decide qué mostrar según haya o no una sesión
// iniciada, y según esa cuenta sea o no administradora.
export function AdminApp() {
  // undefined = todavía no sabemos; null = no hay sesión
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  // resultado de la comprobación de permisos, junto con a qué usuario corresponde
  const [checked, setChecked] = useState<{ userId: string; isAdmin: boolean }>();

  // Supabase avisa acá al cargar la página y cada vez que alguien entra o sale.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase.rpc("is_admin").then(({ data }) => {
      if (!cancelled) setChecked({ userId, isAdmin: data === true });
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);
  const isAdmin = checked?.userId === userId ? checked?.isAdmin : undefined;

  if (session === undefined) return <p className="admin-msg">Cargando…</p>;
  if (session === null) return <Login />;
  if (isAdmin === undefined) return <p className="admin-msg">Comprobando permisos…</p>;
  if (!isAdmin) {
    return (
      <div className="admin-msg">
        <p>Esta cuenta no tiene permisos de administrador.</p>
        <button className="btn ghost small" type="button" onClick={() => supabase.auth.signOut()}>
          Salir
        </button>
      </div>
    );
  }
  return <Panel accessToken={session.access_token} email={session.user.email ?? ""} />;
}
