"use client";

import Link from "next/link";
import { useFavorites } from "@/context/FavoritesContext";
import type { Work } from "@/lib/types";

export default function PosterCard({ work }: { work: Work }) {
  const { isFav, toggle } = useFavorites();
  const fav = isFav(work.id);

  return (
    <Link href={`/obra/${work.id}`} className="text-decoration-none text-white d-block">
      <div className="poster">
        {work.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={work.cover_url} alt={work.title} />
        ) : (
          <i className="bi bi-film" />
        )}
        <span
          role="button"
          tabIndex={0}
          className={`heart-btn ${fav ? "on" : ""}`}
          aria-label={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggle(work.id);
          }}
        >
          <i className={`bi ${fav ? "bi-heart-fill" : "bi-heart"}`} />
        </span>
      </div>
      <div className="d-flex justify-content-between align-items-start mt-2 gap-2">
        <span className="fw-semibold small">{work.title}</span>
        {work.rating_avg !== null && (
          <span className="rating">
            <i className="bi bi-star-fill me-1" />
            {work.rating_avg.toFixed(1)}
          </span>
        )}
      </div>
      <div className="small text-muted-mb">{work.year}</div>
      {work.genre && <span className="tag mt-1">{work.genre}</span>}
    </Link>
  );
}