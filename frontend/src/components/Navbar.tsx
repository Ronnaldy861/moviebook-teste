"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

const links = [
  { href: "/", label: "Início", icon: "bi-house" },
  { href: "/filmes", label: "Filmes", icon: "bi-grid-3x3-gap" },
  { href: "/livros", label: "Livros", icon: "bi-book" },
  { href: "/generos", label: "Gêneros", icon: "bi-list-ul" },
  { href: "/favoritos", label: "Favoritos", icon: "bi-heart" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  function search(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/buscar?q=${encodeURIComponent(q)}`);
  }

  function exit() {
    logout();
    router.push("/login");
  }

  return (
    <nav className="mb-nav">
      <div className="d-flex align-items-center gap-3 px-3 px-lg-4 py-2">
        <Link href="/" className="serif fw-bold text-white text-decoration-none fs-5 me-2">
          MovieBook
        </Link>

        <div className="d-none d-lg-flex gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`nav-pill ${pathname === l.href ? "active" : ""}`}
            >
              <i className={`bi ${l.icon} me-2`} />
              {l.label}
            </Link>
          ))}
        </div>

        <form onSubmit={search} className="mb-search d-flex align-items-center gap-2 flex-grow-1 mx-lg-3" style={{ maxWidth: 520 }}>
          <i className="bi bi-search text-muted-mb" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar e filtrar obras..." />
        </form>

        <div className="ms-auto position-relative">
          {user ? (
            <>
              <button
                onClick={() => setOpen(!open)}
                className="d-flex align-items-center gap-2 bg-transparent text-white px-2 py-1"
                style={{ border: "1px solid var(--mb-border)", borderRadius: 10 }}
              >
                <span className="avatar">{user.name[0].toUpperCase()}</span>
                <span className="d-none d-md-inline small fw-semibold">{user.name.split(" ")[0]}</span>
                <i className="bi bi-chevron-down small text-muted-mb" />
              </button>
              {open && (
                <div className="user-menu" onClick={() => setOpen(false)}>
                  <Link href="/perfil">Meu perfil</Link>
                  <Link href="/favoritos">Meus favoritos</Link>
                  {user.is_admin && <Link href="/admin">Área administrativa</Link>}
                  <button onClick={exit}>Sair</button>
                </div>
              )}
            </>
          ) : (
            <Link href="/login" className="btn-accent text-decoration-none small">Entrar</Link>
          )}
        </div>
      </div>
    </nav>
  );
}