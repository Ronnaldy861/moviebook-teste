
import Link from "next/link";
import type { Work } from "@/lib/types";

export default function BookRow({ work }: { work: Work }) {
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
          <div className="small text-muted-mb">
            {work.creator || work.author || work.year}
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center">
          {work.genre ? (
            <span className="tag">{work.genre}</span>
          ) : (
            <span />
          )}

          <span className="rating">
            {work.rating_avg && (
              <>
                <i className="bi bi-star-fill me-1" />
                {work.rating_avg.toFixed(1)}
              </>
            )}
            <i className="bi bi-heart ms-2 text-muted-mb" />
          </span>
        </div>
      </div>
    </Link>
  );
}
