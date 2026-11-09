"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="container py-5" style={{ maxWidth: 440 }}>
      <div className="d-flex align-items-center gap-3 mb-5">
        <div className="d-flex align-items-center justify-content-center"
             style={{ width: 36, height: 36, borderRadius: 8, background: "var(--mb-accent)" }}>
          <i className="bi bi-journal-text text-white" />
        </div>
        <span className="serif fs-4">MovieBook</span>
      </div>

      <h1 className="serif display-6 mb-2">Bem-vindo de volta</h1>
      <p className="text-muted-mb mb-4">Acesse sua coleção de filmes e livros favoritos</p>

      <form onSubmit={submit}>
        <label className="field-label mb-2">E-mail</label>
        <div className="field-box mb-4">
          <input type="email" placeholder="seu@email.com" value={email}
                 onChange={(e) => setEmail(e.target.value)} />
          <i className="bi bi-person" />
        </div>

        <div className="d-flex justify-content-between mb-2">
          <label className="field-label">Senha</label>
          <Link href="/esqueci-senha" className="small text-decoration-none" style={{ color: "#3d7bff" }}>
            Esqueceu?
          </Link>
        </div>
        <div className="field-box mb-4">
          <input type={show ? "text" : "password"} placeholder="••••••••" value={password}
                 onChange={(e) => setPassword(e.target.value)} />
          <i className={`bi ${show ? "bi-eye-slash" : "bi-eye"}`} onClick={() => setShow(!show)} />
        </div>

        {error && <div className="alert alert-danger py-2 small">{error}</div>}

        <button className="btn-accent w-100 py-3 mt-2" disabled={!email || !password || sending}>
          {sending ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <div className="d-flex align-items-center gap-3 my-4 text-muted-mb small">
        <hr className="flex-grow-1 m-0" /> OU <hr className="flex-grow-1 m-0" />
      </div>

      <p className="text-center text-muted-mb small">
        Não tem uma conta?{" "}
        <Link href="/cadastro" className="text-decoration-none fw-semibold" style={{ color: "#3d7bff" }}>
          Criar conta
        </Link>
      </p>
    </main>
  );
}