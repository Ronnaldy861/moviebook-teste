
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { maskPhone } from "@/lib/masks";

export default function CadastroPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (Number(age) < 1 || Number(age) > 120) {
      setError("Informe uma idade entre 1 e 120 anos.");
      return;
    }

    if (phone.replace(/\D/g, "").length !== 10 &&
        phone.replace(/\D/g, "").length !== 11) {
      setError("Informe um telefone válido com DDD.");
      return;
    }

    setSending(true);

    try {
      await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name,
          age: Number(age),
          phone,
          email,
          password,
        }),
      });

      await login(email, password);

      router.push("/");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao criar a conta."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="container py-5" style={{ maxWidth: 500 }}>
      <div className="d-flex align-items-center gap-3 mb-5">
        <div
          className="d-flex align-items-center justify-content-center"
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "var(--mb-accent)",
          }}
        >
          <i className="bi bi-journal-text text-white" />
        </div>

        <span className="serif fs-4">MovieBook</span>
      </div>

      <h1 className="serif display-6 mb-2">Crie sua conta</h1>

      <p className="text-muted-mb mb-4">
        Cadastre-se para organizar sua coleção de filmes e livros favoritos.
      </p>

      <form onSubmit={submit}>
        <div className="mb-3">
          <label className="field-label mb-2">Nome completo</label>

          <div className="field-box">
            <input
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <i className="bi bi-person" />
          </div>
        </div>

        <div className="row">
          <div className="col-5 mb-3">
            <label className="field-label mb-2">Idade</label>

            <div className="field-box">
              <input
                type="number"
                placeholder="18"
                min="1"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
              />
              <i className="bi bi-calendar3" />
            </div>
          </div>

          <div className="col-7 mb-3">
            <label className="field-label mb-2">Telefone</label>

            <div className="field-box">
              <input
                type="tel"
                placeholder="(84) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(maskPhone(e.target.value))}
                required
              />
              <i className="bi bi-telephone" />
            </div>
          </div>
        </div>

        <div className="mb-3">
          <label className="field-label mb-2">E-mail</label>

          <div className="field-box">
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <i className="bi bi-envelope" />
          </div>
        </div>

        <div className="mb-4">
          <label className="field-label mb-2">Senha</label>

          <div className="field-box">
            <input
              type={show ? "text" : "password"}
              placeholder="Mínimo de 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />

            <i
              className={`bi ${show ? "bi-eye-slash" : "bi-eye"}`}
              onClick={() => setShow(!show)}
              style={{ cursor: "pointer" }}
            />
          </div>
        </div>

        {error && (
          <div className="alert alert-danger py-2 small">
            {error}
          </div>
        )}

        <button
          className="btn-accent w-100 py-3 mt-2"
          disabled={sending}
        >
          {sending ? "Criando conta..." : "Criar conta"}
        </button>
      </form>

      <p className="text-center text-muted-mb small mt-4">
        Já possui uma conta?{" "}
        <Link
          href="/login"
          className="text-decoration-none fw-semibold"
          style={{ color: "#3d7bff" }}
        >
          Entrar
        </Link>
      </p>
    </main>
  );
}
