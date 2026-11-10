"use client";

import { useCallback, useEffect, useState } from "react";
import type { Product } from "@/lib/catalog";

const STORAGE_KEY = "hayat-favorites-v1";

function readFavorites(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return [
      ...new Set(
        parsed.filter(
          (id): id is string =>
            typeof id === "string" &&
            id.length > 0 &&
            id.length <= 128 &&
            id.trim() === id,
        ),
      ),
    ].slice(0, 200);
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  // The first client render matches SSR; browser persistence loads after mount.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      setFavorites(readFavorites(localStorage.getItem(STORAGE_KEY)));
    } catch {
      // Favorites still work in memory when browser storage is unavailable.
    }
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // A blocked or full storage area must not interrupt shopping.
    }
  }, [favorites, ready]);

  const toggle = useCallback((product: Product) => {
    setFavorites((current) =>
      current.includes(product.id)
        ? current.filter((id) => id !== product.id)
        : [...current, product.id].slice(-200),
    );
  }, []);

  return { favorites, toggle, ready };
}
