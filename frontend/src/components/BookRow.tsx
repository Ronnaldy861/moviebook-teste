"use client";

import Link from "next/link";
import { useFavorites } from "@/context/FavoritesContext";
import type { Work } from "@/lib/types";

export default function BookRow({ work }: { work: Work }) {
  const { isFav, toggle } = useFavorites();
  const fav = isFav(work.id);

  return (
    <Link href={`/obra/${work.id}`} className="book-row">
      <div className="book-cover">
        {work.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={work.cover_url} alt={work.title} />
        ) : (
          <i className="bi bi-book fs-4" />
        )}
      </div>
      <div className="d-flex flex-column justify-content-between flex-grow-1">
        <div>
          <div className="fw-semibold">{work.title}</div>
          <div className="small text-muted-mb">{work.creator || work.year}</div>
        </div>
        <div className="d-flex justify-content-between align-items-center">
          {work.genre ? <span className="tag">{work.genre}</span> : <span />}
          <span className="rating">
            {work.rating_avg !== null && (
              <>
                <i className="bi bi-star-fill me-1" />
                {work.rating_avg.toFixed(1)}
              </>
            )}
            <i
              role="button"
              className={`bi ${fav ? "bi-heart-fill" : "bi-heart"} ms-2 heart-inline ${fav ? "on" : "text-muted-mb"}`}
              aria-label={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggle(work.id);
              }}
            />
          </span>
        </div>
      </div>
    </Link>
  );
}