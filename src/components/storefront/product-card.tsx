"use client";
/* eslint-disable @next/next/no-img-element */
import { Plus, ImageOff } from "lucide-react";
import { useState } from "react";
import { money, type Product } from "@/lib/catalog";

export function Price({ value }: { value: number }) {
  return (
    <span className="sf-price">
      <bdi>{money(value)}</bdi>
    </span>
  );
}

export function ProductImage({
  src,
  alt,
  className = "",
  priority = false,
}: {
  src?: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed)
    return (
      <div
        className={`sf-image-fallback ${className}`}
        role="img"
        aria-label={`صورة ${alt} غير متاحة`}
      >
        <ImageOff size={25} />
        <span>الصورة قريباً</span>
      </div>
    );
  return (
    <img
      className={className}
      src={src}
      alt={alt}
      width={280}
      height={350}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export default function ProductCard({
  product: p,
  onInspect,
  onAdd,
  priority = false,
}: {
  product: Product;
  onInspect: (p: Product) => void;
  onAdd: (p: Product) => void;
  priority?: boolean;
}) {
  return (
    <article
      className={`sf-product product-card ${!p.available ? "is-unavailable" : ""}`}
    >
      <button
        className="sf-product-image product-image"
        onClick={() => onInspect(p)}
        aria-label={`تفاصيل ${p.name}`}
      >
        <ProductImage
          key={p.image_url}
          src={p.image_url}
          alt={p.name}
          priority={priority}
        />
        {!p.available ? (
          <span className="sf-badge">نفدت الكمية</span>
        ) : p.featured ? (
          <span className="sf-badge">مختار لكِ</span>
        ) : null}
        {p.is_demo && <span className="sf-demo-tag">نموذج تجريبي</span>}
      </button>
      <div className="sf-product-body">
        <bdi className="sf-brand-name" dir="auto">
          {p.brand}
        </bdi>
        <button
          className="sf-product-title"
          onClick={() => onInspect(p)}
          dir="auto"
        >
          {p.name}
        </button>
        <Price value={p.price} />
        <button
          className="sf-add"
          disabled={!p.available}
          onClick={() => onAdd(p)}
          aria-label={`أضف ${p.name} للسلة`}
        >
          <Plus size={17} />
          {p.available ? "أضف للسلة" : "غير متوفر"}
        </button>
      </div>
    </article>
  );
}
