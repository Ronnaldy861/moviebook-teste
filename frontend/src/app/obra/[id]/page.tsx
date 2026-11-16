"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { initials, timeAgo } from "@/lib/format";
import type { MyStatus, Review, Work } from "@/lib/types";

export default function WorkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();

  const [work, setWork] = useState<Work | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFav, setIsFav] = useState(false);
  const [hasMyRating, setHasMyRating] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const close = useCallback(() => {
    if (window.history.length > 1) router.back();
    else router.push("/");
  }, [router]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  const load = useCallback(async () => {
    try {
      const [w, r, me] = await Promise.all([
        api<Work>(`/api/works/${id}`),
        api<Review[]>(`/api/works/${id}/ratings`),
        api<MyStatus>(`/api/works/${id}/me`),
      ]);
      setWork(w);
      setReviews(r);
      setIsFav(me.is_favorite);
      setHasMyRating(me.my_score !== null);
      setScore(me.my_score);
      setComment(me.my_comment ?? "");
    } catch {
      setNotFound(true);
    }
  }, [id]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  if (loading || !user) return null;

  if (notFound) {
    return (
      <div className="detail-overlay">
        <div className="detail-modal p-5 text-center">
          <h1 className="serif h3">Obra não encontrada</h1>
          <p className="text-muted-mb">Ela pode ter sido excluída.</p>
          <button className="btn-accent" onClick={() => router.push("/")}>Voltar ao início</button>
        </div>
      </div>
    );
  }

  if (!work) return null;

  const isMovie = work.type === "filme";
  const canDelete = user.is_admin || work.created_by === user.id;

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (score === null) return;
    setError("");
    setMessage("");
    setSending(true);
    try {
      await api(`/api/works/${id}/ratings`, {
        method: "POST",
        body: JSON.stringify({ score, comment }),
      });
      setMessage(hasMyRating ? "Avaliação atualizada!" : "Avaliação publicada!");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao publicar.");
    } finally {
      setSending(false);
    }
  }

  async function removeReview() {
    setError("");
    setMessage("");
    try {
      await api(`/api/works/${id}/ratings`, { method: "DELETE" });
      setMessage("Avaliação removida.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover.");
    }
  }

  async function toggleFavorite() {
    try {
      await api(`/api/favorites/${id}`, { method: isFav ? "DELETE" : "POST" });
      setIsFav(!isFav);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao favoritar.");
    }
  }

  async function deleteWork() {
    if (!confirm("Excluir esta obra? Essa ação não pode ser desfeita.")) return;
    try {
      await api(`/api/works/${id}`, { method: "DELETE" });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir.");
    }
  }

  return (
    <div className="detail-overlay">
      <article className="detail-modal">
        {/* CABEÇALHO */}
        <header className="detail-head">
          <div className="detail-cover">
            {work.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={work.cover_url} alt={work.title} />
            ) : (
              <i className={`bi ${isMovie ? "bi-film" : "bi-book"}`} />
            )}
          </div>

          <div>
            <span className="type-pill mb-3">{isMovie ? "Filme" : "Livro"}</span>
            <h1 className="serif fw-bold mb-2" style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>
              {work.title}
            </h1>
            {work.creator && (
              <div className="text-muted-mb mb-3">
                {isMovie ? "Direção: " : ""}{work.creator}
              </div>
            )}
            <div className="d-flex flex-wrap gap-2 mt-2">
              {work.genres.map((g) => <span key={g} className="meta-chip">{g}</span>)}
              {work.year && <span className="meta-chip">{work.year}</span>}
              {work.length && (
                <span className="meta-chip">{work.length} {isMovie ? "min" : "págs."}</span>
              )}
              {work.age_rating && <span className="meta-chip">{work.age_rating === "Livre" ? "Livre" : `${work.age_rating}+`}</span>}
              {work.rating_avg !== null && (
                <span className="meta-chip rate">
                  <i className="bi bi-star-fill" />{work.rating_avg.toFixed(1)}
                </span>
              )}
            </div>
          </div>

          <div className="position-absolute d-flex gap-2" style={{ top: "1.2rem", right: "1.4rem" }}>
            <button
              className={`icon-btn ${isFav ? "on" : ""}`}
              onClick={toggleFavorite}
              aria-label={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              title={isFav ? "Remover dos favoritos" : "Favoritar"}
            >
              <i className={`bi ${isFav ? "bi-heart-fill" : "bi-heart"}`} />
            </button>
            {canDelete && (
              <button className="icon-btn" onClick={deleteWork} aria-label="Excluir obra" title="Excluir obra">
                <i className="bi bi-trash" />
              </button>
            )}
            <button className="icon-btn" onClick={close} aria-label="Fechar">
              <i className="bi bi-x-lg" />
            </button>
          </div>
        </header>

        {/* CORPO */}
        <div className="detail-body">
          <div>
            <div className="section-head">
              <span className="bar" />
              <h2>{isMovie ? "Sinopse" : "Resumo"}</h2>
            </div>
            <p className="synopsis mb-5">{work.synopsis || "Nenhuma sinopse cadastrada."}</p>

            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="section-head m-0">
                <span className="bar" />
                <div>
                  <h2>Avaliações da comunidade</h2>
                  <div className="small text-muted-mb">
                    {work.rating_count} {work.rating_count === 1 ? "avaliação" : "avaliações"}
                  </div>
                </div>
              </div>
              {work.rating_avg !== null && (
                <span className="serif avg-big">{work.rating_avg.toFixed(1)}</span>
              )}
            </div>

            {reviews.length === 0 ? (
              <p className="text-muted-mb">Ninguém avaliou ainda. Seja o primeiro!</p>
            ) : (
              <div className="d-flex flex-column gap-3">
                {reviews.map((r) => (
                  <div className="review-card" key={r.id}>
                    <div className="d-flex align-items-center gap-3">
                      <div className="review-avatar">{initials(r.user_name)}</div>
                      <div className="flex-grow-1">
                        <div className="fw-semibold small">{r.user_name}</div>
                        <div className="text-muted-mb" style={{ fontSize: "0.75rem" }}>
                          {timeAgo(r.created_at)}
                        </div>
                      </div>
                      <span className="score-pill">
                        <i className="bi bi-star-fill me-1" />{r.score}/10
                      </span>
                    </div>
                    {r.comment && (
                      <p className="synopsis mt-3 mb-0" style={{ lineHeight: 1.6, paddingLeft: "3rem" }}>
                        {r.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FORMULÁRIO */}
          <form className="opinion-card" onSubmit={submitReview}>
            <div className="eyebrow mb-1" style={{ letterSpacing: "0.15em" }}>Sua opinião</div>
            <h3 className="serif fw-bold mb-1" style={{ fontSize: "1.4rem" }}>Avalie esta obra</h3>
            <p className="text-muted-mb mb-4" style={{ fontSize: "0.78rem" }}>
              Dê uma nota de 0 a 10 e compartilhe o que achou.
            </p>

            <label className="form-label-mb d-block mb-2">Sua nota</label>
            <div className="score-row mb-4">
              {Array.from({ length: 11 }, (_, n) => (
                <button
                  type="button" key={n}
                  className={`score-btn ${score === n ? "active" : ""}`}
                  onClick={() => setScore(n)}
                >
                  {n}
                </button>
              ))}
            </div>

            <label className="form-label-mb d-block mb-2">Seu comentário</label>
            <div className="field-box area">
              <textarea
                rows={5} maxLength={500}
                placeholder="O que mais chamou sua atenção?"
                value={comment} onChange={(e) => setComment(e.target.value)}
              />
            </div>
            <div className="text-end small text-muted-mb mt-1 mb-3">{comment.length}/500</div>

            {error && <div className="alert alert-danger py-2 small">{error}</div>}
            {message && <div className="alert alert-success py-2 small">{message}</div>}

            <button className="btn-accent btn-glow w-100 py-3" disabled={score === null || sending}>
              {sending ? "Publicando..." : hasMyRating ? "Atualizar avaliação" : "Publicar avaliação"}
            </button>
            {hasMyRating && (
              <button
                type="button"
                className="btn btn-link w-100 text-danger text-decoration-none small mt-2"
                onClick={removeReview}
              >
                Remover minha avaliação
              </button>
            )}
          </form>
        </div>
      </article>
    </div>
  );
}