"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BookRow from "@/components/BookRow";
import Navbar from "@/components/Navbar";
import PosterCard from "@/components/PosterCard";
import { useAuth } from "@/context/AuthContext";
import { useFavorites } from "@/context/FavoritesContext";
import { api } from "@/lib/api";
import type { Work } from "@/lib/types";

export default function FavoritosPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { ids, loaded } = useFavorites();
  const [works, setWorks] = useState<Work[]>([]);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    api<Work[]>("/api/favorites")
      .then(setWorks)
      .catch(console.error)
      .finally(() => setFetched(true));
  }, [user]);

  if (loading || !user) return null;

  // se o usuário desfavoritar aqui, a obra some da lista na hora
  const visible = loaded ? works.filter((w) => ids.has(w.id)) : works;
  const movies = visible.filter((w) => w.type === "filme");
  const books = visible.filter((w) => w.type === "livro");

  return (
    <>
      <Navbar />
      <main className="container py-4" style={{ maxWidth: 1240 }}>
        <header className="page-head">
          <div>
            <div className="eyebrow mb-2">
              <i className="bi bi-heart-fill me-2" />Sua coleção
            </div>
            <h1 className="serif fw-bold mb-1" style={{ fontSize: "2.2rem" }}>Meus favoritos</h1>
            <p className="text-muted-mb m-0">
              Todos os filmes e livros que você marcou para encontrar com facilidade.
            </p>
          </div>
          <span className="count-pill">
            {visible.length} {visible.length === 1 ? "obra salva" : "obras salvas"}
          </span>
        </header>

        {fetched && visible.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon"><i className="bi bi-heart" /></span>
            <h2 className="serif fw-bold h4">Sua lista está vazia</h2>
            <p className="text-muted-mb mb-4 mx-auto" style={{ maxWidth: 340 }}>
              Marque o coração em qualquer filme ou livro para guardar a obra aqui.
            </p>
            <Link href="/" className="btn-accent btn-glow text-decoration-none d-inline-block">
              Descobrir obras
            </Link>
          </div>
        )}

        {movies.length > 0 && (
          <section className="mb-5">
            <h2 className="section-title mb-3">Filmes</h2>
            <div className="row row-cols-2 row-cols-md-3 row-cols-lg-5 g-4">
              {movies.map((w) => (
                <div className="col" key={w.id}><PosterCard work={w} /></div>
              ))}
            </div>
          </section>
        )}

        {books.length > 0 && (
          <section className="mb-5">
            <h2 className="section-title mb-3">Livros</h2>
            <div className="row g-3">
              {books.map((w) => (
                <div className="col-lg-6" key={w.id}><BookRow work={w} /></div>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
