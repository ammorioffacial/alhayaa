"use client";
/* Full navigation ensures server authentication state is read afresh. */
/* eslint-disable @next/next/no-html-link-for-pages, @next/next/no-location-assign-relative-destination */
import { useState } from "react";
import Brand from "@/components/brand";
export default function Login() {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = Object.fromEntries(new FormData(e.currentTarget));
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      window.location.assign("/admin");
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر الاتصال");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login">
      <Brand />
      <h1>أهلاً دكتور</h1>
      <p>سجّل الدخول لإدارة منتجات الصيدلية.</p>
      <form className="form" onSubmit={submit}>
        <label>
          البريد الإلكتروني
          <input
            name="email"
            type="email"
            autoComplete="username"
            dir="ltr"
            required
          />
        </label>
        <label>
          كلمة المرور
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            dir="ltr"
            required
            maxLength={200}
          />
        </label>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        <button className="primary" disabled={busy}>
          {busy ? "جارٍ تسجيل الدخول…" : "تسجيل الدخول"}
        </button>
        <a href="/">العودة إلى المتجر ←</a>
      </form>
    </main>
  );
}
