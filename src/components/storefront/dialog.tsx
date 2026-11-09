"use client";
import { useEffect, useRef } from "react";
import { ArrowRight, X } from "lucide-react";
export default function Dialog({
  title,
  close,
  children,
  cart = false,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
  cart?: boolean;
}) {
  const closeRef = useRef(close);
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    closeRef.current = close;
  }, [close]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const root = dialogRef.current;
    root?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") closeRef.current();
      if (e.key !== "Tab") return;
      const els = root?.querySelectorAll<HTMLElement>(
        'button:not(:disabled),a[href],input,textarea,select,[tabindex="0"]',
      );
      if (!els?.length) return;
      const first = els[0],
        last = els[els.length - 1];
      if (
        e.shiftKey &&
        (document.activeElement === first || document.activeElement === root)
      ) {
        e.preventDefault();
        last.focus();
      } else if (
        !e.shiftKey &&
        (document.activeElement === last || document.activeElement === root)
      ) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      previous?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <div
      className={`sf-dialog-backdrop ${cart ? "sf-cart-backdrop" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cart ? "sf-cart-dialog" : "sf-detail-dialog modal"}
      >
        <div className="sf-dialog-heading">
          <button aria-label="إغلاق" onClick={close}>
            {cart ? <ArrowRight /> : <X />}
          </button>
          <h2>{title}</h2>
          <span className="sf-dialog-wordmark">حياة المجد</span>
        </div>
        {children}
      </section>
    </div>
  );
}
