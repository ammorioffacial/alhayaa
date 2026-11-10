"use client";
import { useEffect, useRef } from "react";
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  MessageCircle,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { type Product } from "@/lib/catalog";
import type { useShopping } from "./use-shopping";
import { Price, ProductImage } from "./product-card";
import Dialog from "./dialog";
export default function Cart({
  shop,
  products,
  demo,
  close,
  returnFocus,
}: {
  shop: ReturnType<typeof useShopping>;
  products: Product[];
  demo: boolean;
  close: () => void;
  returnFocus?: HTMLElement | null;
}) {
  const feedbackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (shop.preview) feedbackRef.current?.scrollIntoView({ block: "nearest" });
  }, [shop.preview]);
  return (
    <Dialog
      cart
      title={`سلّتك (${shop.count})`}
      close={close}
      returnFocus={returnFocus}
    >
      {!shop.cart.length ? (
        <div className="sf-empty-cart">
          <span>
            <ShoppingBag aria-hidden="true" size={40} />
          </span>
          <h3>سلّتك تنتظر اختياراتك</h3>
          <p>كل روتين جميل يبدأ باختيار صغير.</p>
          <button className="sf-primary" onClick={close}>
            تصفّح المنتجات
          </button>
        </div>
      ) : (
        <>
          <div className="sf-cart-scroll">
            <div className="sf-cart-intro">
              <ShoppingBag aria-hidden="true" size={18} />
              <span>اختياراتك، في مكان واحد</span>
              <small>{shop.count} قطع</small>
            </div>
            <div className="sf-cart-lines">
              {shop.cart.map((item) => {
                const p = products.find((p) => p.id === item.id);
                return (
                  <article className="sf-cart-item" key={item.id}>
                    <div className="sf-cart-thumbnail">
                      <ProductImage
                        key={p?.image_url}
                        src={p?.image_url}
                        alt={item.name}
                      />
                    </div>
                    <div className="sf-cart-item-content">
                      <bdi className="sf-brand-name">
                        {p?.brand || "حياة المجد"}
                      </bdi>
                      <h3 dir="auto">{item.name}</h3>
                      <Price value={item.price} />
                      <div className="sf-cart-controls">
                        <div className="sf-quantity">
                          <button
                            aria-label={`تقليل ${item.name}`}
                            onClick={() =>
                              shop.quantity(item.id, item.quantity - 1)
                            }
                          >
                            <Minus aria-hidden="true" size={16} />
                          </button>
                          <output aria-label={`كمية ${item.name}`}>
                            {item.quantity}
                          </output>
                          <button
                            aria-label={`زيادة ${item.name}`}
                            disabled={item.quantity >= 99}
                            onClick={() =>
                              shop.quantity(item.id, item.quantity + 1)
                            }
                          >
                            <Plus aria-hidden="true" size={16} />
                          </button>
                        </div>
                        <button
                          className="sf-remove"
                          aria-label={`حذف ${item.name}`}
                          onClick={() => shop.quantity(item.id, 0)}
                        >
                          <Trash2 aria-hidden="true" size={17} />
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>
                    {shop.changes
                      .filter((c) => c.id === item.id)
                      .map((c) => (
                        <p className="sf-error sf-item-change" key={c.id}>
                          {c.message}
                        </p>
                      ))}
                  </article>
                );
              })}
            </div>
            <form
              id="checkout-form"
              className="sf-checkout-form"
              onSubmit={shop.checkout}
              onChange={shop.clearPreview}
            >
              <div className="sf-form-heading">
                <span>
                  <MapPin aria-hidden="true" size={19} />
                </span>
                <div>
                  <h3>تفاصيل التوصيل</h3>
                  <p>حتى نوصّل طلبكِ إلى المكان الصحيح</p>
                </div>
              </div>
              <div className="sf-field-row">
                <label>
                  الاسم الكامل
                  <input
                    name="name"
                    autoComplete="name"
                    placeholder="الاسم الكامل"
                    required
                    minLength={2}
                    maxLength={100}
                  />
                </label>
                <label>
                  رقم الهاتف
                  <input
                    name="phone"
                    autoComplete="tel"
                    type="tel"
                    dir="ltr"
                    placeholder="07xxxxxxxxx"
                    required
                    maxLength={14}
                  />
                </label>
              </div>
              <label>
                عنوان التوصيل
                <textarea
                  name="address"
                  autoComplete="street-address"
                  placeholder="المنطقة، الشارع، أقرب نقطة دالة"
                  required
                  minLength={8}
                  maxLength={500}
                  rows={2}
                />
              </label>
              <label>
                ملاحظات (اختياري)
                <textarea
                  name="notes"
                  placeholder="أي تفاصيل تساعدنا في توصيل طلبك"
                  maxLength={1000}
                  rows={2}
                />
              </label>
              {shop.error && (
                <p className="sf-error" role="alert">
                  {shop.error}
                </p>
              )}
            </form>
            {demo && (
              <p className="sf-cart-demo">
                معاينة تجريبية: تظهر الرسالة هنا دون إرسال طلب فعلي.
              </p>
            )}
            {shop.preview && (
              <div
                ref={feedbackRef}
                className="sf-message-preview message-preview"
                role="status"
                data-whatsapp-url={shop.previewUrl}
              >
                <h3>معاينة الرسالة التجريبية</h3>
                <pre>{shop.preview}</pre>
              </div>
            )}
            <p className="sf-confirm-note">
              <ShieldCheck aria-hidden="true" size={16} />
              فتح واتساب لا يؤكد الطلب؛ أرسلي الرسالة لتأكيده مع الصيدلية.
            </p>
          </div>
          <div className="sf-cart-summary">
            <div>
              <span>إجمالي المنتجات</span>
              <Price value={shop.total} />
            </div>
            <p>رسوم التوصيل تُؤكَّد عبر واتساب</p>
            <button
              className="sf-primary"
              type="submit"
              form="checkout-form"
              disabled={shop.busy}
            >
              {shop.busy ? "جارٍ التحقق من المنتجات…" : "أرسل الطلب على واتساب"}
              <MessageCircle aria-hidden="true" size={20} />
            </button>
          </div>
        </>
      )}
    </Dialog>
  );
}
