"use client";
/* eslint-disable @next/next/no-img-element */
import { Heart, Plus, ImageOff } from "lucide-react";
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
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!src || failedSrc === src)
    return (
      <div
        className={`sf-image-fallback ${className}`}
        role="img"
        aria-label={`صورة ${alt} غير متاحة`}
      >
        <ImageOff size={28} strokeWidth={1.5} aria-hidden="true" />
        <span>الصورة غير متاحة</span>
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
      onError={() => setFailedSrc(src)}
    />
  );
}

export default function ProductCard({
  product: p,
  onInspect,
  onAdd,
  priority = false,
  favorite = false,
  onFavorite,
}: {
  product: Product;
  onInspect: (p: Product) => void;
  onAdd: (p: Product) => void;
  priority?: boolean;
  favorite?: boolean;
  onFavorite?: (p: Product) => void;
}) {
  return (
    <article
      className={`sf-product product-card ${!p.available ? "is-unavailable" : ""}`}
    >
      <div className="sf-product-visual">
        <button
          type="button"
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
        </button>
        {!p.available ? (
          <span className="sf-badge sf-badge-unavailable">غير متوفر</span>
        ) : p.featured ? (
          <span className="sf-badge">مختار لكِ</span>
        ) : null}
        {onFavorite ? (
          <button
            type="button"
            className={`sf-favorite ${favorite ? "is-favorite" : ""}`}
            onClick={() => onFavorite(p)}
            aria-pressed={favorite}
            aria-label={
              favorite
                ? `إزالة ${p.name} من المفضلة`
                : `إضافة ${p.name} إلى المفضلة`
            }
          >
            <Heart size={19} strokeWidth={1.6} aria-hidden="true" />
          </button>
        ) : null}
        {p.is_demo ? <span className="sf-demo-tag">نموذج تجريبي</span> : null}
      </div>
      <div className="sf-product-body">
        <bdi className="sf-brand-name" dir="auto">
          {p.brand}
        </bdi>
        <button
          type="button"
          className="sf-product-title"
          onClick={() => onInspect(p)}
          dir="auto"
        >
          {p.name}
        </button>
        <span className="sf-product-category">{p.category}</span>
        <Price value={p.price} />
        <button
          type="button"
          className="sf-add"
          disabled={!p.available}
          onClick={() => onAdd(p)}
          aria-label={`أضف ${p.name} للسلة`}
        >
          <Plus size={17} strokeWidth={1.8} aria-hidden="true" />
          {p.available ? "أضف للسلة" : "غير متوفر"}
        </button>
      </div>
    </article>
  );
}
