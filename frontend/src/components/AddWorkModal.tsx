"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { fileToDataUrl } from "@/lib/image";
import type { Genre, Work } from "@/lib/types";

const RATINGS = ["Livre", "10", "12", "15", "18"];

interface Props {
  work?: Work;                        // se vier, o modal edita essa obra
  initialType?: "filme" | "livro";    // tipo inicial ao adicionar
  onClose: () => void;
  onCreated: () => void;              // chamado depois de criar OU salvar
}

export default function AddWorkModal({ work, initialType, onClose, onCreated }: Props) {
  const editing = !!work;

  const [type, setType] = useState<"filme" | "livro">(work?.type ?? initialType ?? "filme");
  const [cover, setCover] = useState<string | null>(work?.cover_url || null);
  const [title, setTitle] = useState(work?.title ?? "");
  const [year, setYear] = useState(work?.year ? String(work.year) : "");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [genreIds, setGenreIds] = useState<number[]>(work?.genre_ids ?? []);
  const [synopsis, setSynopsis] = useState(work?.synopsis ?? "");
  const [creator, setCreator] = useState(work?.creator ?? "");
  const [company, setCompany] = useState(work?.company ?? "");
  const [length, setLength] = useState(work?.length ? String(work.length) : "");
  const [ageRating, setAgeRating] = useState(work?.age_rating ?? "Livre");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isMovie = type === "filme";

  useEffect(() => {
    api<Genre[]>("/api/genres").then(setGenres).catch(console.error);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  async function handleFile(file?: File) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Use uma imagem PNG, JPG ou WEBP.");
      return;
    }
    setError("");
    try {
      setCover(await fileToDataUrl(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao ler a imagem.");
    }
  }

  function toggleGenre(id: number) {
    setGenreIds((ids) => (ids.includes(id) ? ids.filter((g) => g !== id) : [...ids, id]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      await api(work ? `/api/works/${work.id}` : "/api/works", {
        method: work ? "PUT" : "POST",
        body: JSON.stringify({
          type,
          title,
          cover_url: cover ?? "",
          year: year ? Number(year) : null,
          genre_ids: genreIds,
          synopsis,
          creator,
          company,
          length: length ? Number(length) : null,
          age_rating: ageRating,
        }),
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar a obra.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="mb-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form className="mb-modal" onSubmit={submit}>
        <header className="mb-modal-head">
          <div className="eyebrow mb-1">
            ● {editing ? "Editar item" : "Novo item no catálogo"}
          </div>
          <h2 className="serif fw-bold mb-1" style={{ fontSize: "1.9rem" }}>
            {editing ? "Editar obra" : "Adicionar obra"}
          </h2>
          <p className="text-muted-mb small m-0">
            {editing
              ? "Atualize as informações da obra e salve as alterações."
              : "Preencha as informações para organizar sua próxima descoberta."}
          </p>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Fechar">
            <i className="bi bi-x-lg" />
          </button>
        </header>

        <div className="mb-modal-body">
          <label className="form-label-mb d-block mb-2">Tipo de obra</label>
          <div className="d-flex gap-3 mb-4">
            <button
              type="button" disabled={editing}
              className={`type-btn ${isMovie ? "active" : ""}`}
              onClick={() => setType("filme")}
            >
              <i className="bi bi-film me-2" />Filme
            </button>
            <button
              type="button" disabled={editing}
              className={`type-btn ${!isMovie ? "active" : ""}`}
              onClick={() => setType("livro")}
            >
              <i className="bi bi-book me-2" />Livro
            </button>
          </div>

          <div className="d-flex justify-content-between mb-2">
            <label className="form-label-mb">Foto da capa</label>
            <span className="optional">Opcional</span>
          </div>
          <div
            className={`dropzone mb-4 ${dragging ? "drag" : ""}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFile(e.dataTransfer.files[0]);
            }}
          >
            {cover ? (
              <div className="d-flex align-items-center justify-content-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cover} alt="Prévia da capa" className="cover-preview" />
                <div className="text-start">
                  <div className="fw-semibold">Capa selecionada</div>
                  <div className="small text-muted-mb mb-1">Clique para trocar</div>
                  <button
                    type="button"
                    className="btn btn-link p-0 small text-decoration-none text-danger"
                    onClick={(e) => { e.stopPropagation(); setCover(null); }}
                  >
                    Remover
                  </button>
                </div>
              </div>
            ) : (
              <>
                <span className="drop-icon mb-3"><i className="bi bi-image" /></span>
                <div className="fw-semibold">Clique para anexar ou arraste uma imagem</div>
                <div className="small text-muted-mb">PNG, JPG ou WEBP</div>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />

          <div className="row g-3 mb-4">
            <div className="col-sm-9">
              <label className="form-label-mb d-block mb-2">Título</label>
              <div className="field-box">
                <input
                  placeholder={isMovie ? "Ex.: Interestelar" : "Ex.: O Hobbit"}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="col-sm-3">
              <label className="form-label-mb d-block mb-2">Ano de publicação</label>
              <div className="field-box">
                <input
                  type="number" min={1800} max={2100} placeholder="2024"
                  value={year} onChange={(e) => setYear(e.target.value)}
                />
              </div>
            </div>
          </div>

          <label className="form-label-mb d-block">Gêneros</label>
          <div className="small text-muted-mb mb-2">Selecione uma ou mais opções.</div>
          <div className="d-flex flex-wrap gap-2 mb-4">
            {genres.map((g) => (
              <button
                type="button" key={g.id}
                className={`chip ${genreIds.includes(g.id) ? "active" : ""}`}
                onClick={() => toggleGenre(g.id)}
              >
                {g.name}
              </button>
            ))}
          </div>

          <label className="form-label-mb d-block mb-2">{isMovie ? "Sinopse" : "Resumo"}</label>
          <div className="field-box area">
            <textarea
              rows={4} maxLength={600}
              placeholder="Conte brevemente sobre a história, sem revelar demais..."
              value={synopsis} onChange={(e) => setSynopsis(e.target.value)}
            />
          </div>
          <div className="text-end small text-muted-mb mt-1 mb-4">{synopsis.length}/600</div>

          <div className="row g-3 mb-4">
            <div className="col-sm-4">
              <div className="d-flex justify-content-between mb-2">
                <label className="form-label-mb">{isMovie ? "Direção" : "Autor(a)"}</label>
                <span className="optional">Opcional</span>
              </div>
              <div className="field-box">
                <input
                  placeholder={isMovie ? "Nome do diretor" : "Nome do autor"}
                  value={creator} onChange={(e) => setCreator(e.target.value)}
                />
              </div>
            </div>
            <div className="col-sm-4">
              <div className="d-flex justify-content-between mb-2">
                <label className="form-label-mb">{isMovie ? "Estúdio" : "Editora"}</label>
                <span className="optional">Opcional</span>
              </div>
              <div className="field-box">
                <input
                  placeholder={isMovie ? "Nome do estúdio" : "Nome da editora"}
                  value={company} onChange={(e) => setCompany(e.target.value)}
                />
              </div>
            </div>
            <div className="col-sm-4">
              <div className="d-flex justify-content-between mb-2">
                <label className="form-label-mb">{isMovie ? "Duração" : "Número de páginas"}</label>
                <span className="optional">Opcional</span>
              </div>
              <div className="field-box">
                <input
                  inputMode="numeric"
                  placeholder={isMovie ? "Ex.: 148 min" : "Ex.: 320"}
                  value={length}
                  onChange={(e) => setLength(e.target.value.replace(/\D/g, ""))}
                />
              </div>
            </div>
          </div>

          <label className="form-label-mb d-block mb-2">Classificação indicativa</label>
          <div className="d-flex gap-2">
            {RATINGS.map((r) => (
              <button
                type="button" key={r}
                className={`rate-btn ${ageRating === r ? "active" : ""}`}
                onClick={() => setAgeRating(r)}
              >
                {r}
              </button>
            ))}
          </div>

          {error && <div className="alert alert-danger py-2 small mt-4 mb-0">{error}</div>}
        </div>

        <footer className="mb-modal-foot">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-accent btn-glow" disabled={!title.trim() || sending}>
            {sending ? "Salvando..." : editing ? "Salvar alterações" : "+ Adicionar ao catálogo"}
          </button>
        </footer>
      </form>
    </div>
  );
}