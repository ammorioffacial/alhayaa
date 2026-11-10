"use client";
/* Full navigation ensures server authentication state is read afresh. */
/* eslint-disable @next/next/no-html-link-for-pages, @next/next/no-location-assign-relative-destination */
import { useState } from "react";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
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
    <main className="login-screen">
      <div className="login-layout">
        <aside className="login-aside" aria-label="إدارة صيدلية حياة المجد">
          <ShieldCheck size={38} strokeWidth={1.5} aria-hidden="true" />
          <h2>
            عنايتك بالتفاصيل،
            <br />
            تصنع الفرق.
          </h2>
          <p>
            مساحتك لإدارة المنتجات والصور والتوفر، ليجد زبائن الصيدلية كل ما
            يحتاجونه.
          </p>
          <span>صيدلية حياة المجد · بغداد</span>
        </aside>
        <section className="login" aria-labelledby="login-title">
          <Brand />
          <div className="login-heading">
            <span className="login-lock">
              <LockKeyhole size={19} aria-hidden="true" />
            </span>
            <h1 id="login-title">أهلاً دكتور</h1>
            <p>سجّل الدخول لإدارة منتجات الصيدلية.</p>
          </div>
          <form className="form" onSubmit={submit} aria-busy={busy}>
            <label>
              البريد الإلكتروني
              <input
                name="email"
                type="email"
                autoComplete="username"
                spellCheck={false}
                dir="ltr"
                required
                maxLength={254}
                placeholder="doctor@example.com"
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
            <a href="/" className="login-back">
              <ArrowRight size={17} aria-hidden="true" />
              العودة إلى المتجر
            </a>
          </form>
        </section>
      </div>
    </main>
  );
}
