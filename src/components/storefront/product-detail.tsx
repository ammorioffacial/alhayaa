"use client";

import {
  ArrowUpLeft,
  Check,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
} from "lucide-react";
import { useId, useState } from "react";
import type { Product } from "@/lib/catalog";
import { Price, ProductImage, useAddedFeedback } from "./product-card";
import { flyToCart } from "./fly-to-cart";

export default function ProductDetail({
  product,
  products,
  onAdd,
  onSelect,
  favorite,
  onFavorite,
}: {
  product: Product;
  products: Product[];
  onAdd: (product: Product, quantity?: number) => void;
  onSelect: (product: Product) => void;
  favorite: boolean;
  onFavorite: (product: Product) => void;
}) {
  const quantityId = useId();
  const [quantity, setQuantity] = useState(1);
  const feedback = useAddedFeedback();
  const related = products
    .filter((p) => p.category !== null && p.category.id === product.category?.id && p.id !== product.id)
    .slice(0, 2);

  return (
    <div className="sf-product-detail">
      <div className="sf-detail-main">
        <div className="sf-detail-visual">
          <ProductImage src={product.image_url} alt={product.name} priority />
          {product.is_demo ? (
            <span className="sf-detail-demo">نموذج تجريبي</span>
          ) : null}
        </div>
        <div className="sf-detail-content">
          <div className="sf-detail-category">{product.category?.name_ar ?? ""}</div>
          <bdi className="sf-detail-brand" dir="auto">
            {product.brand}
          </bdi>
          <h3 className="sf-detail-name" dir="auto">
            {product.name}
          </h3>
          <div className="sf-detail-price-row">
            <Price value={product.price} />
            <span
              className={`sf-stock-status ${product.available ? "is-available" : ""}`}
            >
              <span aria-hidden="true" />
              {product.available ? "متوفر" : "غير متوفر حالياً"}
            </span>
          </div>
          <div className="sf-detail-description">
            <h4>عن المنتج</h4>
            <p dir="auto">{product.description}</p>
          </div>
          <div className="sf-detail-purchase">
            <div className="sf-detail-quantity-row">
              <label htmlFor={quantityId}>الكمية</label>
              <div className="sf-detail-quantity">
                <button
                  type="button"
                  aria-label="تقليل الكمية"
                  disabled={!product.available || quantity <= 1}
                  onClick={() =>
                    setQuantity((current) => Math.max(1, current - 1))
                  }
                >
                  <Minus size={17} aria-hidden="true" />
                </button>
                <input
                  id={quantityId}
                  name="quantity"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={99}
                  step={1}
                  value={quantity}
                  disabled={!product.available}
                  onChange={(event) => {
                    const value = Number.parseInt(event.target.value, 10);
                    setQuantity(
                      Number.isFinite(value)
                        ? Math.min(99, Math.max(1, value))
                        : 1,
                    );
                  }}
                />
                <button
                  type="button"
                  aria-label="زيادة الكمية"
                  disabled={!product.available || quantity >= 99}
                  onClick={() =>
                    setQuantity((current) => Math.min(99, current + 1))
                  }
                >
                  <Plus size={17} aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="sf-detail-actions">
              <button
                type="button"
                className={`sf-detail-add ${feedback.added ? "is-added" : ""}`}
                disabled={!product.available}
                onClick={(event) => {
                  flyToCart(event.currentTarget);
                  feedback.mark();
                  onAdd(product, quantity);
                }}
              >
                <span key={feedback.pulse} className="sf-add-label">
                  {!product.available ? (
                    "غير متوفر حالياً"
                  ) : feedback.added ? (
                    <>
                      <Check size={19} strokeWidth={2.2} aria-hidden="true" />
                      أُضيف
                    </>
                  ) : (
                    <>
                      <ShoppingBag
                        size={19}
                        strokeWidth={1.7}
                        aria-hidden="true"
                      />
                      أضف إلى السلة
                    </>
                  )}
                </span>
              </button>
              <button
                type="button"
                className={`sf-detail-favorite ${favorite ? "is-favorite" : ""}`}
                aria-pressed={favorite}
                aria-label={
                  favorite
                    ? `إزالة ${product.name} من المفضلة`
                    : `إضافة ${product.name} إلى المفضلة`
                }
                onClick={() => onFavorite(product)}
              >
                <Heart size={21} strokeWidth={1.6} aria-hidden="true" />
              </button>
            </div>
            {quantity > 1 ? (
              <div className="sf-detail-total" aria-live="polite">
                <span>المجموع لـ {quantity} قطع</span>
                <Price value={product.price * quantity} />
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {related.length > 0 ? (
        <section
          className="sf-related"
          aria-labelledby={`${quantityId}-related`}
        >
          <h3 id={`${quantityId}-related`}>من نفس القسم</h3>
          <div className="sf-related-grid">
            {related.map((item) => (
              <button
                type="button"
                key={item.id}
                className="sf-related-item"
                onClick={(event) => {
                  setQuantity(1);
                  const dialog =
                    event.currentTarget.closest<HTMLElement>('[role="dialog"]');
                  dialog?.scrollTo({ top: 0, behavior: "instant" });
                  dialog
                    ?.querySelector<HTMLButtonElement>(
                      ".sf-dialog-heading button",
                    )
                    ?.focus();
                  onSelect(item);
                }}
                aria-label={`تفاصيل ${item.name}`}
              >
                <div className="sf-related-image">
                  <ProductImage src={item.image_url} alt={item.name} />
                </div>
                <div className="sf-related-copy">
                  <bdi dir="auto">{item.brand}</bdi>
                  <strong dir="auto">{item.name}</strong>
                  <Price value={item.price} />
                </div>
                <ArrowUpLeft size={18} aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
