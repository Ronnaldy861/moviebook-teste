"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { fileToDataUrl } from "@/lib/image";
import type { Genre } from "@/lib/types";

interface AddWorkModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddWorkModal({
  onClose,
  onSuccess,
}: AddWorkModalProps) {
  const [type, setType] = useState<"filme" | "livro">("filme");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);

  const [title, setTitle] = useState("");
  const [creator, setCreator] = useState("");
  const [company, setCompany] = useState("");
  const [year, setYear] = useState("");
  const [length, setLength] = useState("");
  const [ageRating, setAgeRating] = useState("Livre");
  const [synopsis, setSynopsis] = useState("");

  const [cover, setCover] = useState("");
  const [coverName, setCoverName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadGenres() {
      try {
        const data = await api<Genre[]>("/api/genres");
        setGenres(data);
      } catch {
        setError("Não foi possível carregar os gêneros.");
      }
    }

    loadGenres();
  }, []);

  function toggleGenre(id: number) {
    setSelectedGenres((current) =>
      current.includes(id)
        ? current.filter((genreId) => genreId !== id)
        : [...current, id]
    );
  }

  async function handleCoverChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      const dataUrl = await fileToDataUrl(file);

      if (dataUrl.length > 700000) {
        setError("A imagem é muito grande. Escolha uma imagem menor.");
        return;
      }

      setCover(dataUrl);
      setCoverName(file.name);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar a imagem."
      );
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (selectedGenres.length === 0) {
      setError("Selecione pelo menos um gênero.");
      return;
    }

    if (!title.trim() || !creator.trim() || !year) {
      setError("Preencha os campos obrigatórios.");
      return;
    }

    setLoading(true);

    try {
      await api("/api/works", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          type,
          creator: creator.trim(),
          company: company.trim() || null,
          year: Number(year),
          length: length ? Number(length) : null,
          age_rating: ageRating,
          synopsis: synopsis.trim() || null,
          cover_url: cover || null,
          genre_ids: selectedGenres,
        }),
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível cadastrar a obra."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="add-work-overlay" onClick={onClose}>
      <div
        className="add-work-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="add-work-header">
          <h2>Adicionar obra</h2>

          <button
            type="button"
            className="add-work-close"
            onClick={onClose}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="add-work-type">
            <button
              type="button"
              className={type === "filme" ? "active" : ""}
              onClick={() => setType("filme")}
            >
              Filme
            </button>

            <button
              type="button"
              className={type === "livro" ? "active" : ""}
              onClick={() => setType("livro")}
            >
              Livro
            </button>
          </div>

          <div className="mb-3">
            <label className="form-label">Título *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome da obra"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">
              {type === "filme" ? "Direção *" : "Autor *"}
            </label>
            <input
              type="text"
              value={creator}
              onChange={(e) => setCreator(e.target.value)}
              placeholder={
                type === "filme"
                  ? "Nome do diretor"
                  : "Nome do autor"
              }
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">
              {type === "filme" ? "Produtora" : "Editora"}
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder={
                type === "filme"
                  ? "Nome da produtora"
                  : "Nome da editora"
              }
            />
          </div>

          <div className="row g-3 mb-3">
            <div className="col-6">
              <label className="form-label">Ano *</label>
              <input
                type="number"
                min="1"
                max="2100"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="Ex.: 2024"
                required
              />
            </div>

            <div className="col-6">
              <label className="form-label">
                {type === "filme" ? "Duração (min)" : "Páginas"}
              </label>
              <input
                type="number"
                min="1"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                placeholder="Ex.: 120"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Classificação indicativa</label>
            <select
              value={ageRating}
              onChange={(e) => setAgeRating(e.target.value)}
            >
              <option value="Livre">Livre</option>
              <option value="10">10 anos</option>
              <option value="12">12 anos</option>
              <option value="15">15 anos</option>
              <option value="18">18 anos</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Gêneros *</label>

            <div className="add-work-genres">
              {genres.map((genre) => (
                <button
                  key={genre.id}
                  type="button"
                  className={`add-work-genre ${
                    selectedGenres.includes(genre.id) ? "selected" : ""
                  }`}
                  onClick={() => toggleGenre(genre.id)}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Sinopse</label>
            <textarea
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="Escreva uma breve descrição da obra..."
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Capa</label>

            <div className="add-work-cover">
              {cover && (
                <img src={cover} alt="Prévia da capa selecionada" />
              )}

              <label>
                {coverName || "Selecionar imagem"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  hidden
                />
              </label>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <div className="add-work-actions">
            <button
              type="button"
              className="add-work-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Cadastrando..." : "Adicionar obra"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}