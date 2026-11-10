"use client";
import Image from "next/image";
import {
  Home,
  LayoutGrid,
  Search,
  ShoppingBag,
  Heart,
  ArrowUpLeft,
} from "lucide-react";
import { categories, type Product } from "@/lib/catalog";
export type Destination =
  "home" | "categories" | "search" | "favorites" | "cart";
const categoryArt = [
  "skincare-care",
  "hair-and-body",
  "sun-care",
  "beauty-polish",
];
const categoryNotes = [
  "كل ما يحتاجه روتينكِ",
  "من الجذور إلى الأطراف",
  "رفيقتكِ في كل يوم",
  "تفاصيل تعبّر عنكِ",
];
export function CategoryShortcuts({
  selected,
  onSelect,
  products,
}: {
  selected: string;
  onSelect: (category: string) => void;
  products: Product[];
}) {
  return (
    <section
      id="categories"
      className="sf-category-section"
      aria-labelledby="category-heading"
    >
      <div className="sf-section-title">
        <h2 id="category-heading">لكل عناية، مساحة</h2>
        <span>تسوّقي حسب احتياجكِ</span>
      </div>
      <div className="sf-categories" aria-label="تصنيفات المنتجات">
        {categories.map((category, i) => (
          <button
            key={category}
            onClick={() => onSelect(category)}
            aria-label={category}
            aria-pressed={selected === category}
            className={`category-${i} ${selected === category ? "is-selected" : ""}`}
          >
            <span className="sf-category-art">
              <Image
                width={160}
                height={160}
                sizes="(max-width: 767px) 78px, 120px"
                src={`/images/categories/${categoryArt[i]}.webp`}
                alt=""
              />
            </span>
            <span className="sf-category-copy">
              <strong>{category}</strong>
              <small>{categoryNotes[i]}</small>
              <span>
                {products.filter((p) => p.category === category).length} منتجات{" "}
                <ArrowUpLeft aria-hidden="true" size={16} />
              </span>
            </span>
          </button>
        ))}
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
  const destinations = [
    { id: "home" as const, label: "الرئيسية", icon: Home },
    { id: "categories" as const, label: "التصنيفات", icon: LayoutGrid },
    { id: "search" as const, label: "البحث", icon: Search },
    { id: "favorites" as const, label: "المفضلة", icon: Heart },
    { id: "cart" as const, label: "السلة", icon: ShoppingBag },
  ];
  return (
    <nav className="sf-bottom-nav" aria-label="التنقل السفلي">
      {destinations.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onNavigate(id)}
          aria-current={active === id ? "page" : undefined}
          aria-label={id === "cart" ? `السلة، ${count} قطع` : label}
        >
          <span className="sf-nav-icon">
            <Icon aria-hidden="true" size={21} />
            {id === "cart" && count > 0 && <b>{count}</b>}
          </span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
