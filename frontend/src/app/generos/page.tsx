"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import BookRow from "@/components/BookRow";
import Navbar from "@/components/Navbar";
import PosterCard from "@/components/PosterCard";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { Genre, Work } from "@/lib/types";

type Tab = "filme" | "livro";

interface Section {
  id: number;
  name: string;
  items: Work[];
}

export default function GenerosPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("filme");
  const [works, setWorks] = useState<Work[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([api<Work[]>("/api/works"), api<Genre[]>("/api/genres")])
      .then(([w, g]) => {
        setWorks(w);
        setGenres(g);
      })
      .catch(console.error)
      .finally(() => setFetched(true));
  }, [user]);

  // agrupa as obras do tipo escolhido por gênero
  const sections = useMemo<Section[]>(() => {
    const ofType = works.filter((w) => w.type === tab);
    const list: Section[] = genres
      .map((g) => ({
        id: g.id,
        name: g.name,
        items: ofType.filter((w) => w.genre_ids.includes(g.id)),
      }))
      .filter((s) => s.items.length > 0);

    const noGenre = ofType.filter((w) => w.genre_ids.length === 0);
    if (noGenre.length > 0) list.push({ id: 0, name: "Sem gênero", items: noGenre });
    return list;
  }, [works, genres, tab]);

  if (loading || !user) return null;

  const isMovie = tab === "filme";

  return (
    <>
      <Navbar />
      <main className="container py-4" style={{ maxWidth: 1240 }}>
        <header className="page-head">
          <div>
            <div className="eyebrow mb-2">Organização do catálogo</div>
            <h1 className="serif fw-bold mb-1" style={{ fontSize: "2.2rem" }}>
              Explorar por gênero
            </h1>
            <p className="text-muted-mb m-0">
              Obras cadastradas no MovieBook, organizadas em fileiras por gênero.
            </p>
          </div>

          <div className="seg-toggle" role="tablist">
            <button
              type="button" role="tab" aria-selected={isMovie}
              className={`seg-btn ${isMovie ? "active" : ""}`}
              onClick={() => setTab("filme")}
            >
              <i className="bi bi-film me-2" />Filmes
            </button>
            <button
              type="button" role="tab" aria-selected={!isMovie}
              className={`seg-btn ${!isMovie ? "active" : ""}`}
              onClick={() => setTab("livro")}
            >
              <i className="bi bi-book me-2" />Livros
            </button>
          </div>
        </header>

        {fetched && sections.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">
              <i className={`bi ${isMovie ? "bi-film" : "bi-book"}`} />
            </span>
            <h2 className="serif fw-bold h4">
              Nenhum {isMovie ? "filme" : "livro"} cadastrado ainda
            </h2>
            <p className="text-muted-mb m-0 mx-auto" style={{ maxWidth: 340 }}>
              Quando alguém cadastrar uma obra, ela aparecerá aqui, separada pelo gênero.
            </p>
          </div>
        )}

        {sections.map((s) => (
          <section className="genre-section" key={s.id}>
            <div className="d-flex align-items-center gap-3 mb-3">
              <span className="accent-bar" style={{ height: 26 }} />
              <h2 className="genre-title m-0">{s.name}</h2>
              <span className="count-badge">{s.items.length}</span>
            </div>

            {isMovie ? (
              <div className="row row-cols-2 row-cols-md-3 row-cols-lg-5 g-4">
                {s.items.map((w) => (
                  <div className="col" key={w.id}><PosterCard work={w} /></div>
                ))}
              </div>
            ) : (
              <div className="row g-3">
                {s.items.map((w) => (
                  <div className="col-lg-6" key={w.id}><BookRow work={w} /></div>
                ))}
              </div>
            )}
          </section>
        ))}
      </main>
    </>
  );
}
