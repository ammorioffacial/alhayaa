"use client";
/* eslint-disable @next/next/no-img-element */
import { Home, LayoutGrid, Search, ShoppingBag } from "lucide-react";
import { categories } from "@/lib/catalog";
export type Destination = "home" | "categories" | "search" | "cart";
export const categoryArt = ["skincare", "haircare", "suncare", "cosmetics"];
export function CategoryShortcuts({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (category: string) => void;
}) {
  return (
    <div
      id="categories"
      className="sf-categories"
      aria-label="تصنيفات المنتجات"
    >
      {categories.map((category, i) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          aria-pressed={selected === category}
          className={selected === category ? "is-selected" : ""}
        >
          <span className={`sf-category-art category-${i}`}>
            <img
              width={100}
              height={100}
              src={`/illustrations/${categoryArt[i]}.svg`}
              alt=""
            />
          </span>
          <span>{category}</span>
        </button>
      ))}
    </div>
  );
}
export default function Navigation({
  active,
  count,
  onNavigate,
  desktop = false,
}: {
  active: Destination;
  count: number;
  onNavigate: (to: Destination) => void;
  desktop?: boolean;
}) {
  const destinations = [
    { id: "home" as const, label: "الرئيسية", icon: Home },
    { id: "categories" as const, label: "التصنيفات", icon: LayoutGrid },
    { id: "search" as const, label: "البحث", icon: Search },
    { id: "cart" as const, label: "السلة", icon: ShoppingBag },
  ];
  return (
    <nav
      className={desktop ? "sf-desktop-nav" : "sf-bottom-nav"}
      aria-label={desktop ? "التنقل الرئيسي" : "التنقل السفلي"}
    >
      {destinations.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onNavigate(id)}
          aria-current={active === id ? "page" : undefined}
          aria-label={id === "cart" ? `السلة، ${count} قطع` : label}
        >
          <span className="sf-nav-icon">
            <Icon size={21} />
            {id === "cart" && count > 0 && <b>{count}</b>}
          </span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
