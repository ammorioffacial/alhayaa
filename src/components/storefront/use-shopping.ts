"use client";
import { useEffect, useState } from "react";
import {
  checkoutSchema,
  reviewOrder,
  type Product,
  type CartItem,
} from "@/lib/catalog";
export function useShopping(products: Product[], demo: boolean) {
  const [cart, setCart] = useState<CartItem[]>([]),
    [ready, setReady] = useState(false),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [preview, setPreview] = useState(""),
    [previewUrl, setPreviewUrl] = useState(""),
    [changes, setChanges] = useState<
      { id: string; message: string; available: boolean }[]
    >([]);
  // Browser-only persistence is hydrated after SSR to avoid a hydration mismatch.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem("hayat-cart") || "[]");
      if (Array.isArray(v))
        setCart(
          v
            .filter(
              (i) =>
                i &&
                typeof i.id === "string" &&
                typeof i.name === "string" &&
                Number.isInteger(i.quantity) &&
                i.quantity > 0 &&
                i.quantity <= 99 &&
                Number.isFinite(i.price) &&
                i.price > 0,
            )
            .slice(0, 100),
        );
    } catch {}
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem("hayat-cart", JSON.stringify(cart));
      } catch {}
    }
  }, [cart, ready]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 2600);
    return () => clearTimeout(timer);
  }, [notice]);
  function clearPreview() {
    setPreview("");
    setPreviewUrl("");
  }
  function add(p: Product, amount = 1) {
    if (!p.available) return;
    const added = Math.max(1, Math.min(99, Math.trunc(amount) || 1));
    setCart((c) =>
      c.some((i) => i.id === p.id)
        ? c.map((i) =>
            i.id === p.id
              ? { ...i, quantity: Math.min(99, i.quantity + added) }
              : i,
          )
        : [...c, { id: p.id, name: p.name, price: p.price, quantity: added }],
    );
    setNotice(`أُضيف ${p.name} إلى السلة`);
    clearPreview();
  }
  function quantity(id: string, n: number) {
    setCart((c) =>
      n <= 0
        ? c.filter((i) => i.id !== id)
        : c.map((i) => (i.id === id ? { ...i, quantity: Math.min(99, n) } : i)),
    );
    clearPreview();
  }
  async function checkout(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    clearPreview();
    const data = checkoutSchema.safeParse({
      customer: Object.fromEntries(new FormData(e.currentTarget)),
      items: cart.map(({ id, quantity, price }) => ({ id, quantity, price })),
    });
    if (!data.success) {
      setError(data.error.issues[0].message);
      return;
    }
    const applyChanges = (
      updates: {
        id: string;
        name: string;
        price: number;
        available: boolean;
        message: string;
      }[],
    ) => {
      setChanges(updates);
      setCart((c) =>
        c.map((i) => {
          const update = updates.find((u) => u.id === i.id);
          return update ? { ...i, price: update.price, name: update.name } : i;
        }),
      );
      setError("تغيرت بعض المنتجات. راجع التنبيهات ثم أعد إرسال الطلب.");
    };
    if (demo) {
      const result = reviewOrder(data.data, products);
      if (result.changes.length) {
        applyChanges(result.changes);
        return;
      }
      setChanges([]);
      setPreview(new URL(result.url!).searchParams.get("text")!);
      setPreviewUrl(result.url!);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.data),
      });
      const result = await res.json();
      if (res.status === 409) {
        applyChanges(result.changes);
        return;
      }
      if (!res.ok) throw new Error(result.error);
      setChanges([]);
      window.location.assign(result.url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "تعذر الاتصال. حاول مجدداً.",
      );
    } finally {
      setBusy(false);
    }
  }
  return {
    cart,
    ready,
    notice,
    busy,
    error,
    preview,
    previewUrl,
    changes,
    add,
    quantity,
    checkout,
    clearPreview,
    count: cart.reduce((s, i) => s + i.quantity, 0),
    total: cart.reduce((s, i) => s + i.quantity * i.price, 0),
  };
}
