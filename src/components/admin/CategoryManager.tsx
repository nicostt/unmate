"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { HoldButton } from "./HoldButton";
import { slugify, type AdminCategory, type AdminProduct } from "./types";

// Categorías de la tienda: agregar, cambiar el nombre y borrar.
// En la tienda una categoría aparece recién cuando tiene algún producto visible.
export function CategoryManager({
  categories,
  products,
  onBack,
  onChanged,
}: {
  categories: AdminCategory[];
  products: AdminProduct[];
  onBack: () => void;
  onChanged: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function run(action: PromiseLike<{ error: { code?: string; message: string } | null }>) {
    setError("");
    const { error } = await action;
    if (error) {
      // 23505 = valor repetido; 23503 = todavía hay productos que la usan
      setError(
        error.code === "23505"
          ? "Ya existe una categoría con ese nombre."
          : error.code === "23503"
            ? "Esa categoría tiene productos. Pasalos a otra categoría o eliminalos antes de borrarla."
            : error.message,
      );
    }
    await onChanged();
    return !error;
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) return;
    const sort_order = Math.max(0, ...categories.map((c) => c.sort_order)) + 1;
    if (await run(supabase.from("categories").insert({ name: clean, slug: slugify(clean), sort_order }))) setName("");
  }

  return (
    <div className="admin-form-wrap">
      <button className="btn ghost small" type="button" onClick={onBack}>
        ← Volver a la lista
      </button>
      <h2>Categorías</h2>

      <div className="admin-list">
        {categories.map((category) => (
          <CategoryRow
            key={category.id}
            category={category}
            count={products.filter((p) => p.category_id === category.id).length}
            onRename={(next) => run(supabase.from("categories").update({ name: next }).eq("id", category.id))}
            onDelete={() => run(supabase.from("categories").delete().eq("id", category.id))}
          />
        ))}
      </div>

      <form className="admin-cat-add" onSubmit={add}>
        <label>
          Categoría nueva
          <input className="field-in" placeholder="Yerba" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <button className="btn primary small" type="submit">
          + Agregar
        </button>
      </form>
      {error && <p className="admin-error">{error}</p>}
    </div>
  );
}

function CategoryRow({
  category,
  count,
  onRename,
  onDelete,
}: {
  category: AdminCategory;
  count: number;
  onRename: (name: string) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
}) {
  const [name, setName] = useState(category.name);
  const changed = name.trim() !== "" && name.trim() !== category.name;

  return (
    <div className="admin-row admin-cat">
      <input className="field-in" aria-label="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
      <span className="muted">
        {count} {count === 1 ? "producto" : "productos"}
      </span>
      <div className="admin-actions">
        <button className="btn ghost small" type="button" disabled={!changed} onClick={() => onRename(name.trim())}>
          Guardar nombre
        </button>
        <HoldButton onConfirm={onDelete} title="Mantené apretado para borrar la categoría">
          Borrar
        </HoldButton>
      </div>
    </div>
  );
}
