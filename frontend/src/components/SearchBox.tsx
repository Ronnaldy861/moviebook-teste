"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { Genre, Work } from "@/lib/types";

type TypeFilter = "todos" | "filme" | "livro";

const AGE_OPTIONS = ["Livre", "10", "12", "15", "18"];
const RATING_OPTIONS = [9, 8, 7, 5];
const MAX_SHOWN = 50;

// tira acentos e deixa minúsculo: "Ação" -> "acao"
const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default function SearchBox() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [type, setType] = useState<TypeFilter>("todos");
  const [genreId, setGenreId] = useState("");
  const [age, setAge] = useState("");
  const [minRating, setMinRating] = useState("");
  const [year, setYear] = useState("");
  const [works, setWorks] = useState<Work[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loaded, setLoaded] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // baixa o catálogo sempre que o painel abre
  useEffect(() => {
    if (!open) return;
    Promise.all([api<Work[]>("/api/works"), api<Genre[]>("/api/genres")])
      .then(([w, g]) => {
        setWorks(w);
        setGenres(g);
      })
      .catch(console.error)
      .finally(() => setLoaded(true));
  }, [open]);

  // fecha ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const usedGenres = useMemo(() => {
    const ids = new Set(works.flatMap((w) => w.genre_ids));
    return genres.filter((g) => ids.has(g.id));
  }, [works, genres]);

  const years = useMemo(
    () =>
      Array.from(
        new Set(works.map((w) => w.year).filter((y): y is number => y !== null))
      ).sort((a, b) => b - a),
    [works]
  );

  const results = useMemo(() => {
    const term = norm(q.trim());
    const gid = genreId ? Number(genreId) : null;
    const min = minRating ? Number(minRating) : null;
    const yr = year ? Number(year) : null;

    return works.filter((w) => {
      if (term && !norm(w.title).includes(term) && !norm(w.creator ?? "").includes(term)) {
        return false;
      }
      if (type !== "todos" && w.type !== type) return false;
      if (gid !== null && !w.genre_ids.includes(gid)) return false;
      if (age && w.age_rating !== age) return false;
      if (min !== null && (w.rating_avg === null || w.rating_avg < min)) return false;
      if (yr !== null && w.year !== yr) return false;
      return true;
    });
  }, [works, q, type, genreId, age, minRating, year]);

  const hasFilters = !!(q || type !== "todos" || genreId || age || minRating || year);

  function clearAll() {
    setQ("");
    setType("todos");
    setGenreId("");
    setAge("");
    setMinRating("");
    setYear("");
  }

  const n = results.length;

  return (
    <div ref={boxRef} className="search-wrap flex-grow-1 mx-lg-3">
      <div className={`mb-search d-flex align-items-center gap-2 ${open ? "open" : ""}`}>
        <i className="bi bi-search text-muted-mb" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Buscar e filtrar obras..."
          aria-label="Buscar obras"
        />
        <button
          type="button"
          className={`filter-btn ${open || hasFilters ? "active" : ""}`}
          onClick={() => setOpen((o) => !o)}
          aria-label="Filtros"
        >
          <i className="bi bi-filter" />
        </button>
      </div>

      {open && (
        <div className="search-panel">
          <div className="sp-head">
            <div className="fw-semibold">Filtrar catálogo</div>
            <div className="small text-muted-mb">Refine sua busca por uma ou mais opções.</div>

            <div className="sp-types">
              {(["todos", "filme", "livro"] as TypeFilter[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`sp-type ${type === t ? "active" : ""}`}
                  onClick={() => setType(t)}
                >
                  {t === "todos" ? "Todos" : t === "filme" ? "Filmes" : "Livros"}
                </button>
              ))}
            </div>

            <div className="sp-selects">
              <label>
                <span className="sp-label">Gênero</span>
                <select className="sp-select" value={genreId} onChange={(e) => setGenreId(e.target.value)}>
                  <option value="">Todos</option>
                  {usedGenres.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </label>

              <label>
                <span className="sp-label">Classificação</span>
                <select className="sp-select" value={age} onChange={(e) => setAge(e.target.value)}>
                  <option value="">Todas</option>
                  {AGE_OPTIONS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </label>

              <label>
                <span className="sp-label">Avaliação</span>
                <select className="sp-select" value={minRating} onChange={(e) => setMinRating(e.target.value)}>
                  <option value="">Qualquer nota</option>
                  {RATING_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r} ou mais</option>
                  ))}
                </select>
              </label>

              <label>
                <span className="sp-label">Ano</span>
                <select className="sp-select" value={year} onChange={(e) => setYear(e.target.value)}>
                  <option value="">Todos os anos</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="sp-results">
            <div className="d-flex justify-content-between align-items-center px-2 mb-2">
              <span className="sp-count">
                {loaded ? `${n} ${n === 1 ? "resultado" : "resultados"}` : "Carregando..."}
              </span>
              {hasFilters && (
                <button type="button" className="sp-clear" onClick={clearAll}>
                  Limpar filtros
                </button>
              )}
            </div>

            {loaded && n === 0 && (
              <div className="text-center text-muted-mb py-4 small">
                Nenhuma obra encontrada com esses filtros.
              </div>
            )}

            {results.slice(0, MAX_SHOWN).map((w) => (
              <Link
                key={w.id}
                href={`/obra/${w.id}`}
                className="sp-item"
                onClick={() => setOpen(false)}
              >
                <div className="sp-thumb">
                  {w.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={w.cover_url} alt="" />
                  ) : (
                    <i className={`bi ${w.type === "filme" ? "bi-film" : "bi-book"}`} />
                  )}
                </div>
                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                  <div className="sp-title">{w.title}</div>
                  <div className="sp-sub">
                    {w.type === "filme" ? "Filme" : "Livro"}
                    {w.genre ? ` · ${w.genre}` : ""}
                  </div>
                </div>
                {w.rating_avg !== null && (
                  <span className="rating">
                    <i className="bi bi-star-fill me-1" />
                    {w.rating_avg.toFixed(1)}
                  </span>
                )}
              </Link>
            ))}

            {n > MAX_SHOWN && (
              <div className="text-center text-muted-mb small py-2">
                Mostrando {MAX_SHOWN} de {n}. Refine a busca para ver as outras.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
