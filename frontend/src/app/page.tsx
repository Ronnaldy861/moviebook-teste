
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import PosterCard from "@/components/PosterCard";
import BookRow from "@/components/BookRow";
import AddWorkModal from "@/components/AddWorkModal";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { Work } from "@/lib/types";

const byRating = (a: Work, b: Work) =>
  (b.rating_avg ?? 0) - (a.rating_avg ?? 0);

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [works, setWorks] = useState<Work[]>([]);
  const [favCount, setFavCount] = useState(0);
  const [showAdd, setShowAdd] = useState(false);

  const loadWorks = useCallback(async () => {
    try {
      const data = await api<Work[]>("/api/works");
      setWorks(data);
    } catch (error) {
      console.error("Erro ao carregar obras:", error);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;

    loadWorks();

    api<Work[]>("/api/favorites")
      .then((favorites) => setFavCount(favorites.length))
      .catch(console.error);
  }, [user, loadWorks]);

  if (loading || !user) return null;

  const movies = works.filter((w) => w.type === "filme");
  const books = works.filter((w) => w.type === "livro");

  const topMovies = [...movies].sort(byRating).slice(0, 5);
  const topBooks = [...books].sort(byRating).slice(0, 5);
  const newBooks = books.slice(0, 5);

  return (
    <>
      <Navbar />

      <main className="container py-4" style={{ maxWidth: 1240 }}>
        {/* HERO */}
        <section className="hero mb-5">
          <span className="pill-badge mb-4">
            Bem-vindo de volta, {user.name.split(" ")[0]}
          </span>

          <h1
            className="serif fw-bold mb-3"
            style={{
              fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
              maxWidth: 420,
              lineHeight: 1.15,
            }}
          >
            Seu universo de filmes e livros
          </h1>

          <p style={{ color: "#6f87c9" }}>
            Gerencie seu catálogo, descubra novidades e compartilhe suas resenhas.
          </p>

          <div className="d-flex flex-wrap justify-content-between align-items-end gap-4 mt-4">
            <button
              type="button"
              className="btn-accent"
              onClick={() => setShowAdd(true)}
            >
              + Adicionar obra
            </button>

            <div className="d-flex gap-4 text-center">
              <div className="hero-stat">
                <strong>{movies.length}</strong>
                <span>Filmes</span>
              </div>

              <div className="hero-stat">
                <strong>{books.length}</strong>
                <span>Livros</span>
              </div>

              <div className="hero-stat">
                <strong>{favCount}</strong>
                <span>Favoritos</span>
              </div>
            </div>
          </div>
        </section>

        {/* FILMES */}
        <section className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center gap-2">
              <h2 className="section-title m-0">
                Filmes Recomendados
              </h2>
              <span className="count-badge">{topMovies.length}</span>
            </div>

            <Link href="/filmes" className="see-all">
              Ver todos <i className="bi bi-arrow-right" />
            </Link>
          </div>

          {topMovies.length === 0 ? (
            <p className="text-muted-mb">
              Nenhum filme cadastrado ainda.
            </p>
          ) : (
            <div className="row row-cols-2 row-cols-md-3 row-cols-lg-5 g-4">
              {topMovies.map((w) => (
                <div className="col" key={w.id}>
                  <PosterCard work={w} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* LIVROS */}
        <section className="row g-5">
          <div className="col-lg-6">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <h2 className="section-title m-0">
                  Livros Recomendados
                </h2>
                <span className="count-badge">{topBooks.length}</span>
              </div>

              <Link href="/livros" className="see-all">
                Ver todos <i className="bi bi-arrow-right" />
              </Link>
            </div>

            <div className="d-flex flex-column gap-3">
              {topBooks.map((w) => (
                <BookRow key={w.id} work={w} />
              ))}
            </div>
          </div>

          <div className="col-lg-6">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <span className="accent-bar" />

                <h2 className="section-title m-0">
                  Livros Recém-Lançados
                </h2>

                <span
                  className="count-badge"
                  style={{ fontSize: "0.65rem" }}
                >
                  NOVO
                </span>
              </div>

              <Link href="/livros" className="see-all">
                Ver todos <i className="bi bi-arrow-right" />
              </Link>
            </div>

            <div className="d-flex flex-column gap-3">
              {newBooks.map((w) => (
                <BookRow key={w.id} work={w} />
              ))}
            </div>
          </div>
        </section>
      </main>

      {showAdd && (
        <AddWorkModal
          onClose={() => setShowAdd(false)}
          onSuccess={loadWorks}
        />
      )}
    </>
  );
}
