"use client";
/* eslint-disable @next/next/no-img-element */
import { useState, useRef } from "react";
import {
  Search,
  ShoppingBag,
  ArrowLeft,
  X,
  MapPin,
  Phone,
  Instagram,
  MessageCircle,
  Check,
  Sun,
} from "lucide-react";
import { type Product, money } from "@/lib/catalog";
import Brand from "../brand";
import ProductCard from "./product-card";
import Navigation, { CategoryShortcuts, type Destination } from "./navigation";
import Dialog from "./dialog";
import Cart from "./cart";
import { useShopping } from "./use-shopping";

export default function Store({
  products,
  demo,
  loadError,
}: {
  products: Product[];
  demo: boolean;
  loadError?: string;
}) {
  const [search, setSearch] = useState(""),
    [category, setCategory] = useState("الكل"),
    [selected, setSelected] = useState<Product | null>(null),
    [cartOpen, setCartOpen] = useState(false),
    [active, setActive] = useState<Destination>("home");
  const inputRef = useRef<HTMLInputElement>(null);
  const shop = useShopping(products, demo);
  const isFiltered = category !== "الكل" || search.trim() !== "";
  const shown = products
    .filter(
      (p) =>
        (category === "الكل" || p.category === category) &&
        `${p.name} ${p.brand}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
    )
    .sort((a, b) => Number(b.featured) - Number(a.featured));
  const featured = shown.filter((p) => p.featured),
    first = isFiltered || !featured.length ? shown : featured,
    rest =
      isFiltered || !featured.length ? [] : shown.filter((p) => !p.featured);
  function go(id: string) {
    document.getElementById(id)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
  }
  function navigate(to: Destination) {
    if (to === "cart") {
      setCartOpen(true);
      return;
    }
    setActive(to);
    if (to === "home") {
      setSearch("");
      setCategory("الكل");
      go("store-home");
    } else if (to === "categories") go("categories");
    else {
      go("shop-search");
      inputRef.current?.focus({ preventScroll: true });
    }
  }
  function choose(value: string) {
    setCategory(value);
    setSearch("");
    setActive("categories");
    go("catalog");
  }
  const navActive = cartOpen ? "cart" : active;
  return (
    <div className="storefront" id="store-home">
      <div className="sf-browse" inert={cartOpen || !!selected}>
        <div className="sf-top-region">
          <header className="sf-header sf-shell">
            <Brand />
            <Navigation
              desktop
              active={navActive}
              count={shop.count}
              onNavigate={navigate}
            />
            <div className="sf-header-actions">
              <button aria-label="فتح البحث" onClick={() => navigate("search")}>
                <Search size={21} />
              </button>
              <button
                aria-label={`السلة، ${shop.count} قطع`}
                onClick={() => setCartOpen(true)}
              >
                <ShoppingBag size={22} />
                {shop.count > 0 && <b>{shop.count}</b>}
              </button>
            </div>
          </header>
          <section
            className="sf-campaign sf-shell"
            aria-label="مجموعة العناية اليومية"
          >
            <div className="sf-campaign-light" />
            <div className="sf-campaign-copy">
              <span className="sf-kicker">
                <span />
                عناية لكل يوم
              </span>
              <h1>
                شمس بغداد؟
                <br />
                <em>خلي العناية وياكِ.</em>
              </h1>
              <p>اكتشفي مجموعة واقيات الشمس</p>
              <button onClick={() => choose("واقيات الشمس")}>
                تسوّقي المجموعة
                <ArrowLeft size={16} />
              </button>
            </div>
            <div className="sf-campaign-art" aria-hidden="true">
              <span className="sf-sun-orbit" />
              <span className="sf-sun-symbol">
                <Sun />
              </span>
              <span className="sf-campaign-plinth" />
              <img
                src="/illustrations/suncare.svg"
                width={240}
                height={240}
                alt=""
              />
              <span className="sf-art-spark one">✦</span>
              <span className="sf-art-spark two">✧</span>
            </div>
          </section>
        </div>
        <main className="sf-shopping">
          <div className="sf-shell">
            <div className="sf-search" id="shop-search">
              <Search size={20} />
              <input
                ref={inputRef}
                value={search}
                aria-label="البحث عن المنتجات"
                placeholder="ابحثي عن منتج أو ماركة..."
                onFocus={() => setActive("search")}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCategory("الكل");
                }}
              />
              {search && (
                <button aria-label="مسح البحث" onClick={() => setSearch("")}>
                  <X size={18} />
                </button>
              )}
            </div>
            <CategoryShortcuts selected={category} onSelect={choose} />
            <section id="catalog" className="sf-catalog">
              <div className="sf-section-title">
                <div>
                  <h2>
                    {isFiltered
                      ? search
                        ? "نتائج البحث"
                        : category
                      : featured.length
                        ? "مختارات الصيدلية"
                        : "منتجات العناية"}
                  </h2>
                  <p>
                    {isFiltered
                      ? `${shown.length} منتجات`
                      : "اختيارات نحبّها لروتينكِ اليومي"}
                  </p>
                </div>
                {isFiltered ? (
                  <button
                    className="sf-text-action"
                    onClick={() => {
                      setCategory("الكل");
                      setSearch("");
                      setActive("home");
                    }}
                  >
                    عرض الكل
                    <ArrowLeft size={16} />
                  </button>
                ) : (
                  <span className="sf-curation-mark">✧</span>
                )}
              </div>
              {demo && (
                <p className="sf-demo-notice">
                  معاينة تجريبية · المنتجات والأسعار للتوضيح فقط
                </p>
              )}
              {loadError ? (
                <div className="sf-empty" role="alert">
                  <h3>تعذر تحميل المنتجات</h3>
                  <p>{loadError}</p>
                  <button
                    className="sf-primary"
                    onClick={() => window.location.reload()}
                  >
                    إعادة المحاولة
                  </button>
                </div>
              ) : !shown.length ? (
                <div className="sf-empty">
                  <Search size={32} />
                  <h3>لا توجد منتجات حالياً</h3>
                  <p>
                    {products.length
                      ? "جرّبي اسماً آخر أو استعرضي كل المنتجات."
                      : "ستظهر اختيارات الصيدلية هنا فور إضافتها."}
                  </p>
                  <button
                    className="sf-primary"
                    onClick={() => {
                      setCategory("الكل");
                      setSearch("");
                    }}
                  >
                    عرض كل المنتجات
                  </button>
                </div>
              ) : (
                <>
                  <div className="sf-product-grid">
                    {first.map((p, i) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        onAdd={shop.add}
                        onInspect={setSelected}
                        priority={i < 2}
                      />
                    ))}
                  </div>
                  {rest.length > 0 && (
                    <>
                      <div className="sf-section-title sf-more-heading">
                        <div>
                          <h2>المزيد لعنايتكِ</h2>
                          <p>كمّلي روتينكِ بما يناسبك</p>
                        </div>
                      </div>
                      <div className="sf-product-grid">
                        {rest.map((p) => (
                          <ProductCard
                            key={p.id}
                            product={p}
                            onAdd={shop.add}
                            onInspect={setSelected}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </section>
            <section className="sf-help">
              <span>
                <MessageCircle size={23} />
              </span>
              <div>
                <h3>محتارة باختياركِ؟</h3>
                <p>اسألي الصيدلية مباشرة على واتساب</p>
              </div>
              <a
                href="https://wa.me/9647711191871"
                target="_blank"
                rel="noreferrer"
                aria-label="تواصلي مع الصيدلية على واتساب"
              >
                <ArrowLeft size={20} />
              </a>
            </section>
          </div>
        </main>
        <footer className="sf-footer">
          <div className="sf-shell">
            <Brand />
            <p>
              <MapPin size={16} />
              بغداد، حي الجامعة، شارع ٦٦، مجاور مركز الجامعة للأشعة التشخيصية
            </p>
            <div className="sf-footer-links">
              <a href="tel:07711191871">
                <Phone size={16} />
                <bdi>07711191871</bdi>
              </a>
              <a
                href="https://www.instagram.com/hayat_almajd.pharmacy/"
                target="_blank"
                rel="noreferrer"
              >
                <Instagram size={16} />
                إنستغرام
              </a>
              <a href="/admin">دخول الإدارة</a>
            </div>
          </div>
        </footer>
        <Navigation
          active={navActive}
          count={shop.count}
          onNavigate={navigate}
        />
      </div>
      {shop.notice && (
        <div className="sf-toast" role="status">
          <Check size={18} />
          {shop.notice}
        </div>
      )}
      {selected && (
        <Dialog title="تفاصيل المنتج" close={() => setSelected(null)}>
          <div className="detail">
            <img
              src={selected.image_url || "/products/placeholder.svg"}
              alt={selected.name}
            />
            <span className="brand-name">{selected.brand}</span>
            <h2>{selected.name}</h2>
            <p>{selected.description}</p>
            <p>
              {selected.available ? "متوفر حالياً" : "نفدت الكمية"}{" "}
              {selected.is_demo ? "• منتج تجريبي" : ""}
            </p>
            <strong>{money(selected.price)}</strong>
            <button
              className="primary full"
              disabled={!selected.available}
              onClick={() => shop.add(selected)}
            >
              أضف إلى السلة <ShoppingBag size={18} />
            </button>
          </div>
        </Dialog>
      )}
      {cartOpen && (
        <Cart
          shop={shop}
          products={products}
          demo={demo}
          close={() => setCartOpen(false)}
        />
      )}
    </div>
  );
}
