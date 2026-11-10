"use client";
/* eslint-disable @next/next/no-img-element */
import { Heart, Plus, Check, ImageOff } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { formatPrice, type Product } from "@/lib/catalog";
import { flyToCart } from "./fly-to-cart";

export function Price({ value }: { value: number }) {
  return (
    <span className="sf-price">
      <bdi>{formatPrice(value)}</bdi>
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
        <ImageOff size={30} strokeWidth={1.5} aria-hidden="true" />
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

/** Press feedback: the label briefly reads "✓ أُضيف", then returns to normal. */
export function useAddedFeedback() {
  const [added, setAdded] = useState(false);
  const [pulse, setPulse] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  function mark() {
    clearTimeout(timer.current);
    setAdded(true);
    setPulse((n) => n + 1);
    timer.current = setTimeout(() => setAdded(false), 1400);
  }
  return { added, pulse, mark };
}

export default function ProductCard({
  product: p,
  index = 0,
  onInspect,
  onAdd,
  priority = false,
  favorite = false,
  onFavorite,
}: {
  product: Product;
  index?: number;
  onInspect: (p: Product) => void;
  onAdd: (p: Product) => void;
  priority?: boolean;
  favorite?: boolean;
  onFavorite?: (p: Product) => void;
}) {
  const feedback = useAddedFeedback();
  return (
    <article
      className={`sf-product product-card ${!p.available ? "is-unavailable" : ""}`}
      style={{ "--i": Math.min(index, 8) } as CSSProperties}
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
            <Heart size={20} strokeWidth={1.7} aria-hidden="true" />
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
        <span className="sf-product-category">{p.category?.name_ar ?? ""}</span>
        <Price value={p.price} />
        <button
          type="button"
          className={`sf-add ${feedback.added ? "is-added" : ""}`}
          disabled={!p.available}
          onClick={(event) => {
            flyToCart(event.currentTarget);
            feedback.mark();
            onAdd(p);
          }}
          aria-label={`أضف ${p.name} للسلة`}
        >
          <span key={feedback.pulse} className="sf-add-label">
            {!p.available ? (
              "غير متوفر"
            ) : feedback.added ? (
              <>
                <Check size={18} strokeWidth={2.2} aria-hidden="true" />
                أُضيف
              </>
            ) : (
              <>
                <Plus size={18} strokeWidth={2} aria-hidden="true" />
                أضف للسلة
              </>
            )}
          </span>
        </button>
      </div>
    </article>
  );
}
