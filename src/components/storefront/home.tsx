"use client";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import {
  Search,
  ShoppingBag,
  ShoppingCart,
  ArrowLeft,
  ArrowUpLeft,
  X,
  MapPin,
  Phone,
  Instagram,
  MessageCircle,
  Check,
  Heart,
  Truck,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  LayoutGrid,
  Sparkles,
} from "lucide-react";
import type { Category, Product } from "@/lib/catalog";
import { productCount } from "@/lib/arabic-plural";
import { coverage, mainSections, productsIn } from "@/lib/category-tree";
import Brand from "../brand";
import ProductCard from "./product-card";
import ProductDetail from "./product-detail";
import Navigation, { CategoryShortcuts, type Destination } from "./navigation";
import Dialog from "./dialog";
import Cart from "./cart";
import { useShopping } from "./use-shopping";
import { useFavorites } from "./use-favorites";
import { useReveal } from "./use-reveal";
import CountUp from "./count-up";
import HeroVideo from "./hero-video";
import { CART_ARRIVE_EVENT } from "./fly-to-cart";
import type { HeroClip } from "@/lib/hero-media";
type Sort = "featured" | "price-asc" | "price-desc" | "name";

function EditorialCollection({
  onSelect,
}: {
  onSelect: (slug: string) => void;
}) {
  const reveal = useReveal<HTMLDivElement>();
  return (
    <div className="sf-editorial sf-reveal" ref={reveal}>
      <Image
        src="/images/care-editorial-1200.webp"
        width={1200}
        height={800}
        sizes="(max-width: 767px) 100vw, 50vw"
        alt="صورة تعبيرية لمستحضرات العناية على حجر طبيعي"
      />
      <div>
        <span className="sf-eyebrow">وقتٌ لكِ</span>
        <h2>
          روتينكِ،
          <br />
          على طريقتكِ.
        </h2>
        <button onClick={() => onSelect("skin-care")}>
          اكتشفي العناية بالبشرة <ArrowLeft aria-hidden="true" size={19} />
        </button>
      </div>
    </div>
  );
}

export default function Store({
  products,
  categories: allCategories,
  demo,
  loadError,
  heroVideos = [],
}: {
  products: Product[];
  categories: Category[];
  demo: boolean;
  loadError?: string;
  heroVideos?: HeroClip[];
}) {
  // Main sections that have at least one product (in the section or in its subcategories) are shown.
  // Subcategories appear under the selected section (owner decision: no empty sections on the storefront).
  const categories = mainSections(allCategories).filter(
    (c) => c.is_visible && productsIn(products, allCategories, c.id).length > 0,
  );
  const [search, setSearch] = useState("");
  // Selected category slug, or "الكل" for every product.
  const [category, setCategory] = useState("الكل");
  const selectedCategory = allCategories.find((c) => c.slug === category);
  const selectionIds = selectedCategory ? coverage(allCategories, selectedCategory.id) : null;
  const [selected, setSelected] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [active, setActive] = useState<Destination>("home");
  const [sort, setSort] = useState<Sort>("featured");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [returnFocus, setReturnFocus] = useState<HTMLElement | null>(null);
  const shop = useShopping(products, demo);
  const { favorites, toggle } = useFavorites();
  const catalogReveal = useReveal<HTMLElement>();
  const collectionsReveal = useReveal<HTMLElement>();
  const helpReveal = useReveal<HTMLElement>();
  const trustReveal = useReveal<HTMLDivElement>();
  // The cart badges pop when the flying dot arrives, not when the item is added.
  useEffect(() => {
    function pop() {
      document.querySelectorAll<HTMLElement>("[data-cart-count]").forEach((el) => {
        el.classList.remove("is-pop");
        void el.offsetWidth;
        el.classList.add("is-pop");
      });
    }
    window.addEventListener(CART_ARRIVE_EVENT, pop);
    return () => window.removeEventListener(CART_ARRIVE_EVENT, pop);
  }, []);
  const isFiltered =
    category !== "الكل" ||
    !!search.trim() ||
    availableOnly ||
    favoritesOnly ||
    sort !== "featured";
  const shown = products
    .filter(
      (p) =>
        // Products in a hidden category stay in the admin only.
        p.category !== null &&
        p.category.is_visible &&
        (!selectionIds || selectionIds.has(p.category.id)) &&
        `${p.name} ${p.brand}`
          .toLocaleLowerCase("ar")
          .includes(search.trim().toLocaleLowerCase("ar")) &&
        (!availableOnly || p.available) &&
        (!favoritesOnly || favorites.includes(p.id)),
    )
    .sort((a, b) =>
      sort === "price-asc"
        ? a.price - b.price
        : sort === "price-desc"
          ? b.price - a.price
          : sort === "name"
            ? a.name.localeCompare(b.name, "ar")
            : Number(b.featured) - Number(a.featured),
    );
  const featured = shown.filter((p) => p.featured);
  function go(id: string) {
    document.getElementById(id)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
  }
  function reset() {
    setCategory("الكل");
    setSearch("");
    setAvailableOnly(false);
    setFavoritesOnly(false);
    setSort("featured");
    setActive("home");
  }
  function inspect(product: Product) {
    setReturnFocus(document.activeElement as HTMLElement);
    setSelected(product);
  }
  function openCart() {
    setReturnFocus(document.activeElement as HTMLElement);
    setCartOpen(true);
  }
  function navigate(to: Destination) {
    if (to === "cart") {
      openCart();
      return;
    }
    setActive(to);
    if (to === "home") {
      reset();
      go("store-home");
    } else if (to === "categories") go("categories");
    else if (to === "favorites") {
      setFavoritesOnly(true);
      setCategory("الكل");
      setSearch("");
      setAvailableOnly(false);
      go("catalog");
    } else {
      go("shop-search");
      inputRef.current?.focus({ preventScroll: true });
    }
  }
  function choose(value: string) {
    setCategory(value);
    setSearch("");
    setFavoritesOnly(false);
    setActive("categories");
    go("catalog");
  }
  const card = (p: Product, index: number) => (
    <ProductCard
      key={p.id}
      index={index}
      product={p}
      onAdd={shop.add}
      onInspect={inspect}
      favorite={favorites.includes(p.id)}
      onFavorite={toggle}
    />
  );
  return (
    <div className="storefront" id="store-home">
      <div className="sf-ambient" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="sf-browse" inert={cartOpen || !!selected}>
        <a className="sf-skip" href="#catalog">
          انتقلي إلى المنتجات
        </a>
        <header className="sf-site-header">
          <div className="sf-header sf-shell">
            <Brand />
            <form
              className="sf-search"
              id="shop-search"
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                go("catalog");
              }}
            >
              <Search aria-hidden="true" size={21} />
              <input
                ref={inputRef}
                type="text"
                name="q"
                autoComplete="off"
                spellCheck={false}
                value={search}
                aria-label="البحث عن المنتجات"
                placeholder="ابحثي عن منتج أو ماركة…"
                onFocus={() => setActive("search")}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCategory("الكل");
                  setFavoritesOnly(false);
                }}
              />
              {search && (
                <button
                  type="button"
                  aria-label="مسح البحث"
                  onClick={() => setSearch("")}
                >
                  <X aria-hidden="true" size={18} />
                </button>
              )}
              <button
                className="sf-search-submit"
                type="submit"
                aria-label="عرض نتائج البحث"
              >
                <ArrowLeft aria-hidden="true" size={19} />
              </button>
            </form>
            <div className="sf-header-actions">
              <button
                className={favoritesOnly ? "is-active" : ""}
                aria-label="عرض المفضلة"
                onClick={() => navigate("favorites")}
              >
                <Heart aria-hidden="true" size={21} />
                <span>المفضلة</span>
                {favorites.length > 0 && <b>{favorites.length}</b>}
              </button>
              <button
                className="sf-header-cart"
                data-cart-target
                aria-label={`السلة، ${shop.count} قطع`}
                onClick={openCart}
              >
                <ShoppingCart aria-hidden="true" size={21} />
                <span>سلّتي</span>
                <b data-cart-count>{shop.count}</b>
              </button>
            </div>
          </div>
          <div className="sf-nav-line">
            <div className="sf-shell">
              <nav className="sf-desktop-nav" aria-label="التنقل الرئيسي">
                <a
                  href="#catalog"
                  onClick={(e) => {
                    e.preventDefault();
                    reset();
                    go("catalog");
                  }}
                >
                  <LayoutGrid aria-hidden="true" size={18} /> كل المنتجات
                </a>
                {categories.map((c) => (
                  <a
                    key={c.id}
                    href="#catalog"
                    aria-current={category === c.slug ? "page" : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      choose(c.slug);
                    }}
                  >
                    {c.name_ar}
                  </a>
                ))}
                <a href="#about">عن الصيدلية</a>
              </nav>
              <a
                className="sf-nav-contact sf-whatsapp-pulse"
                href="https://wa.me/9647711191871"
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle aria-hidden="true" size={18} /> اسألي الصيدلية
              </a>
            </div>
          </div>
        </header>
        <main className="sf-shopping">
          <section
            className="sf-campaign sf-shell"
            aria-labelledby="hero-heading"
          >
            <div className="sf-campaign-art">
              <HeroVideo clips={heroVideos} />
            </div>
            <div className="sf-campaign-shade" aria-hidden="true" />
            <div className="sf-campaign-copy">
              <span className="sf-kicker">
                <Sparkles aria-hidden="true" size={17} />
                حياة المجد، صيدليتكِ في بغداد
              </span>
              <h1 id="hero-heading">
                عنايةٌ أقرب.
                <br />
                حياةٌ أجمل.
              </h1>
              <p>
                من أول خطوة في روتينكِ، إلى تفاصيلكِ المفضّلة.
                <br className="sf-desktop-break" /> اكتشفي عالم البشرة والشعر
                والجمال.
              </p>
              <div className="sf-hero-actions">
                <button
                  className="sf-primary"
                  onClick={() => {
                    reset();
                    go("catalog");
                  }}
                >
                  ابدئي رحلة العناية <ArrowLeft aria-hidden="true" size={19} />
                </button>
                <a
                  className="sf-ghost"
                  href="https://wa.me/9647711191871"
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle aria-hidden="true" size={19} /> واتساب الصيدلية
                </a>
              </div>
              <span className="sf-hero-foot">
                <ShieldCheck aria-hidden="true" size={18} /> اختاري منتجاتكِ
                ونسّقي طلبكِ عبر واتساب
              </span>
            </div>
          </section>
          <div className="sf-shell sf-service-row" ref={trustReveal}>
            <span>
              <ShieldCheck aria-hidden="true" size={24} />
              <span>
                صيدليتكِ في حي الجامعة
                <small>قريبون منكِ ومن تفاصيل عنايتكِ</small>
              </span>
            </span>
            <span>
              <ShoppingBag aria-hidden="true" size={24} />
              <span>
                {productCount(products.length)}
                <small>معروضة في المتجر الآن</small>
              </span>
            </span>
            <span>
              <LayoutGrid aria-hidden="true" size={24} />
              <span>
                <CountUp to={categories.length} /> أقسام
                <small>لتسوّقي حسب احتياجكِ</small>
              </span>
            </span>
            <span>
              <Truck aria-hidden="true" size={24} />
              <span>
                توصيل داخل بغداد
                <small>رسوم التوصيل حسب المحافظة</small>
              </span>
            </span>
          </div>
          <div className="sf-shell sf-content">
            <CategoryShortcuts
              selected={category}
              onSelect={choose}
              products={products}
              categories={allCategories}
            />
            <section
              id="catalog"
              className="sf-catalog sf-reveal"
              aria-labelledby="catalog-heading"
              ref={catalogReveal}
            >
              <div className="sf-section-title sf-catalog-heading">
                <div>
                  <h2 id="catalog-heading">
                    {favoritesOnly
                      ? "المفضلة"
                      : search
                        ? "نتائج البحث"
                        : category !== "الكل"
                          ? selectedCategory?.name_ar ?? category
                          : isFiltered
                            ? "منتجات العناية"
                            : featured.length
                              ? "مختارات الصيدلية"
                              : "منتجات العناية"}
                  </h2>
                  <p>
                    {favoritesOnly
                      ? "اختياراتكِ المحفوظة، لوقت يناسبكِ"
                      : "تفاصيل صغيرة لروتين يشبهكِ"}
                  </p>
                </div>
                <div className="sf-catalog-actions">
                  <span
                    className="sf-result-count"
                    role="status"
                    aria-live="polite"
                  >
                    {productCount(shown.length)}
                  </span>
                  <button
                    className="sf-mobile-filter"
                    aria-label="تصفية وترتيب المنتجات"
                    aria-expanded={showFilters}
                    aria-controls="catalog-filters"
                    onClick={() => setShowFilters((v) => !v)}
                  >
                    <SlidersHorizontal aria-hidden="true" size={20} />
                    {isFiltered && <span className="sf-filter-indicator" />}
                  </button>
                </div>
              </div>
              <div
                id="catalog-filters"
                className={`sf-catalog-toolbar ${showFilters ? "is-open" : ""}`}
              >
                <div className="sf-filter-options">
                  <button
                    className={!isFiltered ? "is-selected" : ""}
                    onClick={reset}
                  >
                    كل المنتجات
                  </button>
                  <button
                    aria-pressed={availableOnly}
                    className={availableOnly ? "is-selected" : ""}
                    onClick={() => setAvailableOnly((v) => !v)}
                  >
                    <span className="sf-availability-dot" /> المتوفر فقط
                  </button>
                  {(category !== "الكل" || search || favoritesOnly) && (
                    <button className="sf-filter-reset" onClick={reset}>
                      مسح التصفية <X aria-hidden="true" size={16} />
                    </button>
                  )}
                </div>
                <label className="sf-sort">
                  <SlidersHorizontal aria-hidden="true" size={18} />
                  <span className="sf-sort-label">ترتيب حسب</span>
                  <select
                    aria-label="ترتيب المنتجات"
                    name="sort"
                    value={sort}
                    onChange={(e) => setSort(e.target.value as Sort)}
                  >
                    <option value="featured">مختارات الصيدلية</option>
                    <option value="price-asc">السعر: الأقل أولاً</option>
                    <option value="price-desc">السعر: الأعلى أولاً</option>
                    <option value="name">الاسم: أ–ي</option>
                  </select>
                </label>
              </div>
              {demo && (
                <p className="sf-demo-notice">
                  معاينة تجريبية · منتجات وصور وأسعار توضيحية فقط.
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
                  {favoritesOnly ? (
                    <Heart aria-hidden="true" size={38} />
                  ) : (
                    <Search aria-hidden="true" size={38} />
                  )}
                  <h3>
                    {favoritesOnly
                      ? "احفظي ما يعجبكِ هنا"
                      : "لا توجد منتجات حالياً"}
                  </h3>
                  <p>
                    {favoritesOnly
                      ? "اضغطي على القلب بجانب المنتج للعودة إليه لاحقاً."
                      : products.length
                        ? "جرّبي كلمة بحث أخرى أو استعرضي كل المنتجات."
                        : "ستظهر منتجات الصيدلية هنا فور إضافتها."}
                  </p>
                  <button className="sf-primary" onClick={reset}>
                    عرض كل المنتجات
                  </button>
                </div>
              ) : (
                <div
                  className="sf-product-grid"
                  key={`${category}-${sort}-${availableOnly}-${favoritesOnly}`}
                >
                  {shown.map(card)}
                </div>
              )}
            </section>
            <section
              className="sf-collections sf-reveal"
              aria-label="مجموعات العناية"
              ref={collectionsReveal}
            >
              <EditorialCollection onSelect={choose} />
              <div className="sf-suncare">
                <Sun aria-hidden="true" size={30} />
                <div>
                  <span className="sf-eyebrow">عناية ترافق يومكِ</span>
                  <h2>
                    شمس بغداد؟
                    <br />
                    خلي العناية وياكِ.
                  </h2>
                  <button onClick={() => choose("sun-care")}>
                    تسوّقي المجموعة <ArrowLeft aria-hidden="true" size={19} />
                  </button>
                </div>
                <Image
                  src="/images/categories/sun-care.webp"
                  width={280}
                  height={280}
                  sizes="200px"
                  alt="رسم تعبيري لعبوة عناية"
                />
              </div>
            </section>
            <section
              className="sf-help sf-reveal"
              id="about"
              ref={helpReveal}
            >
              <div className="sf-help-icon">
                <MessageCircle aria-hidden="true" size={32} />
              </div>
              <div>
                <span className="sf-eyebrow">صيدلية حياة المجد</span>
                <h2>قريبون منكِ، حتى قبل طلبكِ.</h2>
                <p>
                  عندكِ سؤال عن منتج؟ تواصلي مع الصيدلية مباشرة،
                  <br className="sf-desktop-break" /> ويسعدنا الإجابة عن
                  استفساراتكِ وتنسيق طلبكِ.
                </p>
              </div>
              <a
                className="sf-primary sf-whatsapp-pulse"
                href="https://wa.me/9647711191871"
                target="_blank"
                rel="noreferrer"
              >
                تواصلي على واتساب <ArrowUpLeft aria-hidden="true" size={19} />
              </a>
            </section>
          </div>
        </main>
        <footer className="sf-footer" id="contact">
          <div className="sf-shell sf-footer-grid">
            <div>
              <Brand />
              <p>
                مساحتكِ للعناية اليومية.
                <br />
                من صيدليتكِ في بغداد، بكل اهتمام.
              </p>
            </div>
            <div>
              <h3>تسوّقي معنا</h3>
              {categories.map((c) => (
                <a
                  key={c.id}
                  href="#catalog"
                  onClick={(e) => {
                    e.preventDefault();
                    choose(c.slug);
                  }}
                >
                  {c.name_ar}
                </a>
              ))}
            </div>
            <div>
              <h3>زورينا في الصيدلية</h3>
              <p className="sf-address">
                <MapPin aria-hidden="true" size={19} />
                <span>
                  بغداد، حي الجامعة، شارع 66
                  <br />
                  مجاور مركز الجامعة للأشعة التشخيصية
                </span>
              </p>
              <a href="tel:07711191871">
                <Phone aria-hidden="true" size={18} />
                <bdi>0771 119 1871</bdi>
              </a>
            </div>
            <div>
              <h3>نبقى على تواصل</h3>
              <a
                href="https://wa.me/9647711191871"
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle aria-hidden="true" size={18} /> واتساب
              </a>
              <a
                href="https://www.instagram.com/hayat_almajd.pharmacy/"
                target="_blank"
                rel="noreferrer"
              >
                <Instagram aria-hidden="true" size={18} /> إنستغرام
              </a>
            </div>
          </div>
          <div className="sf-shell sf-footer-bottom">
            <span>
              © {new Date().getFullYear()} صيدلية حياة المجد. جميع الحقوق
              محفوظة.
            </span>
            <a href="/admin">دخول الإدارة</a>
          </div>
        </footer>
        <Navigation
          active={cartOpen ? "cart" : active}
          count={shop.count}
          onNavigate={navigate}
        />
      </div>
      {shop.notice && !cartOpen && (
        <div className="sf-toast" role="status">
          <Check aria-hidden="true" size={19} />
          {shop.notice}
        </div>
      )}
      {selected && (
        <Dialog
          title="تفاصيل المنتج"
          close={() => setSelected(null)}
          returnFocus={returnFocus}
        >
          <ProductDetail
            key={selected.id}
            product={selected}
            products={products}
            onAdd={shop.add}
            onSelect={setSelected}
            favorite={favorites.includes(selected.id)}
            onFavorite={toggle}
          />
        </Dialog>
      )}
      {cartOpen && (
        <Cart
          shop={shop}
          products={products}
          demo={demo}
          close={() => setCartOpen(false)}
          returnFocus={returnFocus}
        />
      )}
    </div>
  );
}
