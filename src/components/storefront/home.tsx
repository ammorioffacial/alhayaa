"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import {
  Search,
  ShoppingBag,
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
} from "lucide-react";
import { categories, type Product } from "@/lib/catalog";
import Brand from "../brand";
import ProductCard from "./product-card";
import ProductDetail from "./product-detail";
import Navigation, { CategoryShortcuts, type Destination } from "./navigation";
import Dialog from "./dialog";
import Cart from "./cart";
import { useShopping } from "./use-shopping";
import { useFavorites } from "./use-favorites";
type Sort = "featured" | "price-asc" | "price-desc" | "name";

function EditorialCollection({
  onSelect,
}: {
  onSelect: (category: string) => void;
}) {
  return (
    <div className="sf-editorial">
      <Image
        src="/images/care-editorial-1200.webp"
        width={1200}
        height={800}
        sizes="(max-width: 767px) 100vw, 50vw"
        alt="صورة تعبيرية لمستحضرات العناية على حجر طبيعي"
      />
      <div>
        <span>وقتٌ لكِ</span>
        <h2>
          روتينكِ،
          <br />
          على طريقتكِ.
        </h2>
        <button onClick={() => onSelect("العناية بالبشرة")}>
          اكتشفي العناية بالبشرة <ArrowLeft aria-hidden="true" size={17} />
        </button>
      </div>
    </div>
  );
}

export default function Store({
  products,
  demo,
  loadError,
}: {
  products: Product[];
  demo: boolean;
  loadError?: string;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("الكل");
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
  const isFiltered =
    category !== "الكل" ||
    !!search.trim() ||
    availableOnly ||
    favoritesOnly ||
    sort !== "featured";
  const shown = products
    .filter(
      (p) =>
        (category === "الكل" || p.category === category) &&
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
  const first = isFiltered || !featured.length ? shown : featured;
  const rest =
    isFiltered || !featured.length ? [] : shown.filter((p) => !p.featured);
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
  const card = (p: Product) => (
    <ProductCard
      key={p.id}
      product={p}
      onAdd={shop.add}
      onInspect={inspect}
      favorite={favorites.includes(p.id)}
      onFavorite={toggle}
    />
  );
  return (
    <div className="storefront" id="store-home">
      <div className="sf-browse" inert={cartOpen || !!selected}>
        <a className="sf-skip" href="#catalog">
          انتقلي إلى المنتجات
        </a>
        <div className="sf-service-strip">
          <div className="sf-shell">
            <span>
              <Truck aria-hidden="true" size={15} /> من صيدليتنا إلى باب بيتكِ
            </span>
            <span className="sf-strip-location">
              <MapPin aria-hidden="true" size={14} /> بغداد، حي الجامعة
            </span>
            <a href="tel:07711191871">
              <Phone aria-hidden="true" size={14} />
              <bdi>0771 119 1871</bdi>
            </a>
          </div>
        </div>
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
                aria-label={`السلة، ${shop.count} قطع`}
                onClick={openCart}
              >
                <ShoppingBag aria-hidden="true" size={21} />
                <span>سلّتي</span>
                <b>{shop.count}</b>
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
                  <LayoutGrid aria-hidden="true" size={17} /> كل المنتجات
                </a>
                {categories.map((c) => (
                  <a
                    key={c}
                    href="#catalog"
                    aria-current={category === c ? "page" : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      choose(c);
                    }}
                  >
                    {c}
                  </a>
                ))}
                <a href="#about">عن الصيدلية</a>
              </nav>
              <a
                className="sf-nav-contact"
                href="https://wa.me/9647711191871"
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle aria-hidden="true" size={16} /> اسألي الصيدلية
              </a>
            </div>
          </div>
        </header>
        <main className="sf-shopping">
          <section
            className="sf-campaign sf-shell"
            aria-labelledby="hero-heading"
          >
            <div className="sf-campaign-copy">
              <span className="sf-kicker">
                <span /> من صيدليتكِ في بغداد
              </span>
              <h1 id="hero-heading">
                كل يوم،
                <br />
                عناية تليق بكِ.
              </h1>
              <p>
                اختيارات البشرة والشعر والجمال،
                <br className="sf-desktop-break" /> في مكان واحد قريب منكِ.
              </p>
              <button
                className="sf-primary"
                onClick={() => {
                  reset();
                  go("catalog");
                }}
              >
                اكتشفي منتجات العناية <ArrowLeft aria-hidden="true" size={19} />
              </button>
              <span className="sf-hero-foot">
                <MessageCircle aria-hidden="true" size={16} /> اختاري منتجاتكِ
                ونسّقي طلبكِ عبر واتساب
              </span>
            </div>
            <div className="sf-campaign-art">
              <span className="sf-art-ring" aria-hidden="true" />
              <Image
                src="/images/care-bag-hero.webp"
                width={700}
                height={700}
                sizes="(max-width: 767px) 210px, (max-width: 1100px) 380px, 520px"
                alt="رسم ثلاثي الأبعاد لحقيبة تضم مستحضرات العناية"
                fetchPriority="high"
                loading="eager"
              />
              <span className="sf-art-label">
                <ShieldCheck aria-hidden="true" size={23} />
                <span>
                  عنايتكِ اليومية<small>تبدأ باختياركِ</small>
                </span>
              </span>
            </div>
          </section>
          <div className="sf-shell sf-service-row">
            <span>
              <ShieldCheck aria-hidden="true" size={21} />
              <span>
                صيدليتكِ في حي الجامعة
                <small>قريبون منكِ ومن تفاصيل عنايتكِ</small>
              </span>
            </span>
            <span>
              <MessageCircle aria-hidden="true" size={21} />
              <span>
                تواصل مباشر مع الصيدلية<small>للاستفسار وتنسيق الطلبات</small>
              </span>
            </span>
            <span>
              <Truck aria-hidden="true" size={22} />
              <span>
                توصيل داخل بغداد
                <small>التفاصيل والرسوم تُؤكّد عبر واتساب</small>
              </span>
            </span>
          </div>
          <div className="sf-shell">
            <CategoryShortcuts
              selected={category}
              onSelect={choose}
              products={products}
            />
            <section
              id="catalog"
              className="sf-catalog"
              aria-labelledby="catalog-heading"
            >
              <div className="sf-section-title sf-catalog-heading">
                <div>
                  <h2 id="catalog-heading">
                    {favoritesOnly
                      ? "المفضلة"
                      : search
                        ? "نتائج البحث"
                        : category !== "الكل"
                          ? category
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
                    {shown.length} منتجات
                  </span>
                  <button
                    className="sf-mobile-filter"
                    aria-label="تصفية وترتيب المنتجات"
                    aria-expanded={showFilters}
                    aria-controls="catalog-filters"
                    onClick={() => setShowFilters((v) => !v)}
                  >
                    <SlidersHorizontal aria-hidden="true" size={19} />
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
                      مسح التصفية <X aria-hidden="true" size={14} />
                    </button>
                  )}
                </div>
                <label className="sf-sort">
                  <SlidersHorizontal aria-hidden="true" size={17} />
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
                    <Heart aria-hidden="true" size={35} />
                  ) : (
                    <Search aria-hidden="true" size={35} />
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
                <>
                  <div className="sf-product-grid">{first.map(card)}</div>
                  {rest.length > 0 && (
                    <>
                      <div className="sf-section-title sf-more-heading">
                        <div>
                          <h2>المزيد لعنايتكِ</h2>
                          <p>كمّلي روتينكِ بما يناسبكِ</p>
                        </div>
                      </div>
                      <div className="sf-product-grid sf-secondary-grid">
                        {rest.map(card)}
                        <EditorialCollection onSelect={choose} />
                      </div>
                    </>
                  )}
                </>
              )}
            </section>
            <section
              className={`sf-collections ${rest.length ? "sf-collections-wide" : ""}`}
              aria-label="مجموعات العناية"
            >
              {!rest.length && <EditorialCollection onSelect={choose} />}
              <div className="sf-suncare">
                <Sun aria-hidden="true" size={25} />
                <div>
                  <span>عناية ترافق يومكِ</span>
                  <h2>
                    شمس بغداد؟
                    <br />
                    خلي العناية وياكِ.
                  </h2>
                  <button onClick={() => choose("واقيات الشمس")}>
                    تسوّقي المجموعة <ArrowLeft aria-hidden="true" size={17} />
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
            <section className="sf-help" id="about">
              <div className="sf-help-icon">
                <MessageCircle aria-hidden="true" size={30} />
              </div>
              <div>
                <span className="sf-kicker">صيدلية حياة المجد</span>
                <h2>قريبون منكِ، حتى قبل طلبكِ.</h2>
                <p>
                  عندكِ سؤال عن منتج؟ تواصلي مع الصيدلية مباشرة،
                  <br className="sf-desktop-break" /> ويسعدنا الإجابة عن
                  استفساراتكِ وتنسيق طلبكِ.
                </p>
              </div>
              <a
                className="sf-primary"
                href="https://wa.me/9647711191871"
                target="_blank"
                rel="noreferrer"
              >
                تواصلي على واتساب <ArrowUpLeft aria-hidden="true" size={18} />
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
                  key={c}
                  href="#catalog"
                  onClick={(e) => {
                    e.preventDefault();
                    choose(c);
                  }}
                >
                  {c}
                </a>
              ))}
            </div>
            <div>
              <h3>زورينا في الصيدلية</h3>
              <p className="sf-address">
                <MapPin aria-hidden="true" size={18} />
                <span>
                  بغداد، حي الجامعة، شارع ٦٦
                  <br />
                  مجاور مركز الجامعة للأشعة التشخيصية
                </span>
              </p>
              <a href="tel:07711191871">
                <Phone aria-hidden="true" size={17} />
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
                <MessageCircle aria-hidden="true" size={17} /> واتساب
              </a>
              <a
                href="https://www.instagram.com/hayat_almajd.pharmacy/"
                target="_blank"
                rel="noreferrer"
              >
                <Instagram aria-hidden="true" size={17} /> إنستغرام
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
          <Check aria-hidden="true" size={18} />
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
