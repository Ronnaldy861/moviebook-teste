"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AddWorkModal from "@/components/AddWorkModal";
import BookRow from "@/components/BookRow";
import Navbar from "@/components/Navbar";
import PosterCard from "@/components/PosterCard";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { Work } from "@/lib/types";

function Actions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="card-actions">
      <button type="button" className="mini-btn" onClick={onEdit}>
        <i className="bi bi-pencil me-1" />Editar
      </button>
      <button type="button" className="mini-btn danger" onClick={onDelete}>
        <i className="bi bi-trash me-1" />Excluir
      </button>
    </div>
  );
}

export default function CatalogPage({ type }: { type: "filme" | "livro" }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [works, setWorks] = useState<Work[]>([]);
  const [fetched, setFetched] = useState(false);
  const [modal, setModal] = useState<{ work?: Work } | null>(null);
  const [error, setError] = useState("");

  const isMovie = type === "filme";
  const label = isMovie ? "filme" : "livro";

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  const load = useCallback(() => {
    api<Work[]>("/api/profile/works")
      .then((all) => setWorks(all.filter((w) => w.type === type)))
      .catch(console.error)
      .finally(() => setFetched(true));
  }, [type]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  async function remove(w: Work) {
    if (!confirm(`Excluir "${w.title}"? Essa ação não pode ser desfeita.`)) return;
    setError("");
    try {
      await api(`/api/works/${w.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir.");
    }
  }

  if (loading || !user) return null;

  return (
    <>
      <Navbar />
      <main className="container py-4" style={{ maxWidth: 1240 }}>
        <header className="page-head">
          <div>
            <div className="eyebrow mb-2">Meu catálogo</div>
            <h1 className="serif fw-bold mb-1" style={{ fontSize: "2.2rem" }}>
              {isMovie ? "Filmes" : "Livros"}
            </h1>
            <p className="text-muted-mb m-0">Obras cadastradas por você no MovieBook.</p>
          </div>
          <button className="btn-accent btn-glow" onClick={() => setModal({})}>
            + Adicionar {label}
          </button>
        </header>

        {error && <div className="alert alert-danger py-2 small">{error}</div>}

        {fetched && works.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">
              <i className={`bi ${isMovie ? "bi-film" : "bi-book"}`} />
            </span>
            <h2 className="serif fw-bold h4">Nenhum {label} cadastrado</h2>
            <p className="text-muted-mb m-0 mx-auto" style={{ maxWidth: 320 }}>
              Adicione sua primeira obra e ela aparecerá automaticamente nesta seção.
            </p>
          </div>
        )}

        {works.length > 0 && isMovie && (
          <div className="row row-cols-2 row-cols-md-3 row-cols-lg-5 g-4">
            {works.map((w) => (
              <div className="col" key={w.id}>
                <PosterCard work={w} />
                <Actions onEdit={() => setModal({ work: w })} onDelete={() => remove(w)} />
              </div>
            ))}
          </div>
        )}

        {works.length > 0 && !isMovie && (
          <div className="row g-3">
            {works.map((w) => (
              <div className="col-lg-6" key={w.id}>
                <BookRow work={w} />
                <Actions onEdit={() => setModal({ work: w })} onDelete={() => remove(w)} />
              </div>
            ))}
          </div>
        )}
      </main>

      {modal && (
        <AddWorkModal
          work={modal.work}
          initialType={type}
          onClose={() => setModal(null)}
          onCreated={load}
        />
      )}
    </>
  );
}