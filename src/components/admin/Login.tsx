"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    // Si sale bien no hay nada más que hacer: AdminApp se entera sola y muestra el panel.
    if (error) setError("Email o contraseña incorrectos.");
    setBusy(false);
  }

  return (
    <form className="admin-login" onSubmit={submit}>
      <h1>Panel de unmate.es</h1>
      <label>
        Email
        <input
          className="field-in"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label>
        Contraseña
        <input
          className="field-in"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error && <p className="admin-error">{error}</p>}
      <button className="btn primary" type="submit" disabled={busy}>
        {busy ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
