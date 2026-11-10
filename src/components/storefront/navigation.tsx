"use client";
/* eslint-disable @next/next/no-img-element */
// Category images come from the database (any https URL), so plain <img> is used.
import { Home, LayoutGrid, ShoppingBag, Heart, ArrowUpLeft, Sparkles } from "lucide-react";
import { productCount } from "@/lib/arabic-plural";
import type { Category, Product } from "@/lib/catalog";
import { useReveal } from "./use-reveal";
export type Destination =
  "home" | "categories" | "search" | "favorites" | "cart";
/** Category shortcuts: image when the category has one, otherwise a circular badge in its accent color. */
export function CategoryShortcuts({
  selected,
  onSelect,
  products,
  categories,
}: {
  selected: string;
  onSelect: (slug: string) => void;
  products: Product[];
  categories: Category[];
}) {
  const reveal = useReveal<HTMLElement>();
  return (
    <section
      id="categories"
      className="sf-category-section sf-reveal"
      aria-labelledby="category-heading"
      ref={reveal}
    >
      <div className="sf-section-title">
        <h2 id="category-heading">اختاري عالم عنايتكِ</h2>
        <span>تسوّقي حسب احتياجكِ</span>
      </div>
      <div className="sf-categories" aria-label="تصنيفات المنتجات">
        {categories.map((category, i) => {
          const count = products.filter((p) => p.category?.slug === category.slug).length;
          const isSelected = selected === category.slug;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelect(category.slug)}
              aria-label={category.name_ar}
              aria-pressed={isSelected}
              className={`category-${i % 4} ${isSelected ? "is-selected" : ""}`}
            >
              <span className="sf-category-art">
                {category.image_path ? (
                  <img src={category.image_path} alt="" width={160} height={160} loading="lazy" />
                ) : (
                  <span
                    className="sf-category-badge"
                    style={{ background: category.accent }}
                    aria-hidden="true"
                  >
                    <Sparkles size={30} strokeWidth={1.6} />
                  </span>
                )}
              </span>
              <span className="sf-category-copy">
                <strong>{category.name_ar}</strong>
                {category.description_ar && <small>{category.description_ar}</small>}
                <span>
                  {productCount(count)} <ArrowUpLeft aria-hidden="true" size={17} />
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function Navigation({
  active,
  count,
  onNavigate,
}: {
  active: Destination;
  count: number;
  onNavigate: (to: Destination) => void;
}) {
  // Search lives in the header only. "المنتجات" keeps the existing categories destination.
  const items = [
    { id: "home" as const, label: "الرئيسية", icon: Home },
    { id: "categories" as const, label: "المنتجات", icon: LayoutGrid },
    { id: "favorites" as const, label: "المفضلة", icon: Heart },
  ];
  return (
    <nav className="sf-bottom-nav" aria-label="التنقل السفلي">
      <div className="sf-dock-pill">
        {items.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className="sf-dock-item"
            onClick={() => onNavigate(id)}
            aria-current={active === id ? "page" : undefined}
            aria-label={label}
          >
            <span className="sf-dock-icon">
              <Icon aria-hidden="true" />
            </span>
            <span>{label}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        className="sf-dock-cart"
        onClick={() => onNavigate("cart")}
        aria-current={active === "cart" ? "page" : undefined}
        aria-label={`السلة، ${count} قطع`}
        data-cart-target=""
      >
        <ShoppingBag aria-hidden="true" size={24} />
        {count > 0 && <b data-cart-count>{count}</b>}
      </button>
    </nav>
  );
}
