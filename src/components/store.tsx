"use client";
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect, useRef } from "react";
import {
  Search,
  ShoppingBag,
  ArrowLeft,
  Plus,
  Minus,
  X,
  MapPin,
  Phone,
  Instagram,
  Truck,
  ShieldCheck,
  MessageCircle,
  Leaf,
  Droplets,
  Sun,
  Sparkles,
  Check,
} from "lucide-react";
import {
  categories,
  money,
  type Product,
  type CartItem,
  checkoutSchema,
  reviewOrder,
} from "@/lib/catalog";
import Brand from "./brand";
const icons = [Droplets, Leaf, Sun, Sparkles];
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
    [cart, setCart] = useState<CartItem[]>([]),
    [ready, setReady] = useState(false),
    [cartOpen, setCartOpen] = useState(false),
    [selected, setSelected] = useState<Product | null>(null),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [changes, setChanges] = useState<
      { id: string; message: string; available: boolean }[]
    >([]),
    [preview, setPreview] = useState("");
  // Hydrate browser-only persisted state after SSR; the extra render is intentional.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const value = JSON.parse(localStorage.getItem("hayat-cart") || "[]");
      if (Array.isArray(value))
        setCart(
          value
            .filter(
              (i) =>
                i &&
                typeof i.id === "string" &&
                typeof i.name === "string" &&
                Number.isInteger(i.quantity) &&
                i.quantity > 0 &&
                i.quantity <= 99 &&
                Number.isFinite(i.price) &&
                i.price > 0,
            )
            .slice(0, 100),
        );
    } catch {}
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem("hayat-cart", JSON.stringify(cart));
      } catch {
        /* Storage blocked: keep the current in-memory cart. */
      }
    }
  }, [cart, ready]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 2800);
    return () => clearTimeout(timer);
  }, [notice]);
  const count = cart.reduce((s, i) => s + i.quantity, 0),
    total = cart.reduce((s, i) => s + i.quantity * i.price, 0);
  const shown = products
    .filter(
      (p) =>
        (category === "الكل" || p.category === category) &&
        `${p.name} ${p.brand}`.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => Number(b.featured) - Number(a.featured));
  function add(p: Product) {
    setCart((c) => {
      const found = c.find((i) => i.id === p.id);
      return found
        ? c.map((i) =>
            i.id === p.id
              ? { ...i, quantity: Math.min(99, i.quantity + 1) }
              : i,
          )
        : [...c, { id: p.id, name: p.name, price: p.price, quantity: 1 }];
    });
    setNotice(`أُضيف ${p.name} إلى السلة`);
    setPreview("");
  }
  function quantity(id: string, n: number) {
    setCart((c) =>
      n <= 0
        ? c.filter((i) => i.id !== id)
        : c.map((i) => (i.id === id ? { ...i, quantity: Math.min(99, n) } : i)),
    );
    setPreview("");
  }
  async function checkout(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setPreview("");
    const f = new FormData(e.currentTarget);
    const parsed = checkoutSchema.safeParse({
      customer: Object.fromEntries(f.entries()),
      items: cart.map(({ id, quantity, price }) => ({ id, quantity, price })),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    if (demo) {
      setPreview(
        decodeURIComponent(
          reviewOrder(parsed.data, products).url?.split("?text=")[1] || "",
        ),
      );
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (res.status === 409) {
        setChanges(data.changes);
        setCart((c) =>
          c.map((i) => {
            const change = data.changes.find(
              (v: { id: string }) => v.id === i.id,
            );
            return change
              ? { ...i, price: change.price, name: change.name }
              : i;
          }),
        );
        setError(
          "تغيرت بعض المنتجات. راجع التنبيهات أدناه ثم أعد إرسال الطلب.",
        );
        return;
      }
      if (!res.ok) throw new Error(data.error);
      setChanges([]);
      window.location.assign(data.url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "تعذر الاتصال. حاول مجدداً.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="delivery-bar">
        <Truck size={16} />
        <span>
          من صيدليتنا إلى باب بيتك{" "}
          <span className="desktop">
            — التوصيل داخل بغداد بالتنسيق عبر واتساب
          </span>
        </span>
        <a href="tel:07711191871" dir="ltr">
          0771 119 1871
        </a>
      </div>
      <header>
        <div className="container header-main">
          <Brand />
          <form
            className="header-search"
            onSubmit={(e) => {
              e.preventDefault();
              document
                .getElementById("catalog")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <Search size={21} />
            <input
              aria-label="البحث في المتجر"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ما الذي تبحثين عنه اليوم؟"
            />
            <button type="submit">بحث</button>
          </form>
          <nav aria-label="القائمة الرئيسية">
            <a className="active" href="#catalog">
              المتجر
            </a>
            <a href="#catalog" onClick={() => setCategory("العناية بالبشرة")}>
              العناية بالبشرة
            </a>
            <a href="#about">عن الصيدلية</a>
            <a href="#contact">تواصل معنا</a>
          </nav>
          <button
            className="cart-button"
            onClick={() => setCartOpen(true)}
            aria-label={`السلة، ${count} قطع`}
          >
            <ShoppingBag size={21} />
            <span className="desktop">سلّتي</span>
            <b>{count}</b>
          </button>
        </div>
      </header>
      <main>
        <section className="hero container">
          <div className="hero-copy">
            <span className="eyebrow">
              <span /> جمالكِ، بعناية صيدلانية
            </span>
            <h1>
              عناية تليق بكِ.
              <br />
              <em>وثقة تبدأ من هنا.</em>
            </h1>
            <p>
              اكتشفي أساسيات روتينكِ اليومي للبشرة والشعر والجمال، مع صيدلية
              حياة المجد.
            </p>
            <a href="#catalog" className="primary">
              تسوّقي منتجات العناية <ArrowLeft size={18} />
            </a>
            <div className="hero-foot">
              <span className="hero-seal">
                <ShieldCheck size={21} />
              </span>
              <span>
                من صيدليتكِ في بغداد
                <br />
                <strong>إلى تفاصيل يومكِ</strong>
              </span>
            </div>
          </div>
          <div className="hero-art" aria-label="صورة تعبيرية لروتين العناية">
            <img
              className="hero-photo"
              src="/images/care-editorial.png"
              alt="تكوين تعبيري لمنتجات العناية على حجر طبيعي"
            />
            <div className="art-note">
              <Sparkles size={20} />
              <span>
                وقتٌ لكِ
                <br />
                <strong>وعناية بكل التفاصيل</strong>
              </span>
            </div>
            <span className="art-number">HAYAT ALMAJD · DAILY CARE</span>
          </div>
        </section>
        <div className="container trust-row">
          <span>
            <ShieldCheck />
            عناية من صيدلية تعرفينها
          </span>
          <span>
            <MessageCircle />
            طلب سهل عبر واتساب
          </span>
          <span>
            <Truck />
            توصيل بالتنسيق معك
          </span>
        </div>
        <section
          className="container category-showcase"
          aria-label="تسوّقي حسب احتياجك"
        >
          {categories.map((c, i) => {
            const Icon = icons[i];
            return (
              <a
                key={c}
                href="#catalog"
                onClick={() => {
                  setCategory(c);
                  setSearch("");
                }}
                className={`category-tile tile-${i}`}
              >
                <span className="tile-icon">
                  <Icon />
                </span>
                <span>
                  <strong>{c}</strong>
                  <small>
                    {
                      [
                        "روتينكِ يبدأ من هنا",
                        "عناية من الجذور للأطراف",
                        "حماية لكل يوم",
                        "لمستكِ الخاصة",
                      ][i]
                    }
                  </small>
                </span>
                <ArrowLeft size={18} />
              </a>
            );
          })}
        </section>
        <section className="container catalog" id="catalog">
          <div className="section-heading">
            <div>
              <span className="eyebrow">اختاري ما يناسبك</span>
              <h2>مساحتك للعناية اليومية</h2>
            </div>
            <span className="collection-note">عناية مدروسة. جمال ببساطة.</span>
          </div>
          {demo && (
            <div className="demo-note">
              معاينة تجريبية — المنتجات والصور والأسعار للتوضيح فقط، ولا تمثل
              مخزون الصيدلية.
            </div>
          )}
          <div className="catalog-toolbar">
            <div className="category-list" aria-label="تصنيفات المنتجات">
              <button
                className={category === "الكل" ? "chosen" : ""}
                onClick={() => setCategory("الكل")}
              >
                كل المنتجات
              </button>
              {categories.map((c, i) => {
                const Icon = icons[i];
                return (
                  <button
                    key={c}
                    className={category === c ? "chosen" : ""}
                    onClick={() => setCategory(c)}
                  >
                    <Icon size={17} />
                    {c}
                  </button>
                );
              })}
            </div>
            <label className="search">
              <Search size={19} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحثي عن منتج أو ماركة…"
                aria-label="البحث عن المنتجات"
              />
              {search && (
                <button aria-label="مسح البحث" onClick={() => setSearch("")}>
                  <X size={16} />
                </button>
              )}
            </label>
          </div>
          <div className="results-label">
            <span>
              {search || category !== "الكل"
                ? "نتائج البحث"
                : "منتجات مختارة لكِ"}
            </span>
            <small>{shown.length} منتجات</small>
          </div>
          {loadError ? (
            <div role="alert" className="empty">
              {loadError}
              <button onClick={() => window.location.reload()}>
                إعادة المحاولة
              </button>
            </div>
          ) : !shown.length ? (
            <div className="empty">
              <Search />
              <h3>لا توجد منتجات حالياً</h3>
              <p>
                {products.length
                  ? "جرّبي كلمة بحث أخرى أو تصنيفاً مختلفاً."
                  : "ستظهر منتجات الصيدلية هنا بعد إضافتها."}
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setCategory("الكل");
                }}
              >
                عرض كل المنتجات
              </button>
            </div>
          ) : (
            <div className="product-grid">
              {shown.map((p) => (
                <article className="product-card" key={p.id}>
                  <button
                    className="product-image"
                    onClick={() => setSelected(p)}
                    aria-label={`تفاصيل ${p.name}`}
                  >
                    <img
                      src={p.image_url || "/products/placeholder.svg"}
                      alt={p.name}
                    />
                    {!p.available ? (
                      <span className="badge unavailable">نفدت الكمية</span>
                    ) : p.featured ? (
                      <span className="badge">اختيار مميز</span>
                    ) : null}
                    {p.is_demo && <span className="demo-tag">تجريبي</span>}
                  </button>
                  <div className="product-info">
                    <span className="brand-name">{p.brand}</span>
                    <button
                      className="product-title"
                      onClick={() => setSelected(p)}
                    >
                      {p.name}
                    </button>
                    <small>{p.category}</small>
                    <div className="product-bottom">
                      <strong>{money(p.price)}</strong>
                      <button
                        disabled={!p.available}
                        onClick={() => add(p)}
                        aria-label={`أضف ${p.name} للسلة`}
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        <section id="about" className="container about">
          <div className="about-symbol">✧</div>
          <div>
            <span className="eyebrow">صيدلية حياة المجد</span>
            <h2>قريبون منك، ومن تفاصيل عنايتك.</h2>
            <p>
              تحتاجين مساعدة في اختيار منتجاتك؟ تواصلي مع الصيدلية مباشرة،
              ويسعدنا الإجابة عن استفساراتك وتنسيق طلبك.
            </p>
          </div>
          <a
            href="https://wa.me/9647711191871"
            target="_blank"
            rel="noreferrer"
            className="outline"
          >
            تواصلي معنا <MessageCircle size={18} />
          </a>
        </section>
      </main>
      <footer id="contact">
        <div className="container footer-grid">
          <div>
            <Brand />
            <p>عناية تثقين بها، كل يوم.</p>
          </div>
          <div>
            <h3>زورونا في الصيدلية</h3>
            <p>
              <MapPin size={17} />
              بغداد، حي الجامعة، شارع ٦٦،
              <br /> مجاور مركز الجامعة للأشعة التشخيصية
            </p>
          </div>
          <div>
            <h3>نبقى على تواصل</h3>
            <a href="tel:07711191871">
              <Phone size={16} />
              <span dir="ltr">07711191871</span>
            </a>
            <a
              href="https://www.instagram.com/hayat_almajd.pharmacy/"
              target="_blank"
              rel="noreferrer"
            >
              <Instagram size={16} /> إنستغرام
            </a>
            <a
              href="https://wa.me/9647711191871"
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={16} /> واتساب
            </a>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} صيدلية حياة المجد</span>
          <a href="/admin">دخول الإدارة</a>
        </div>
      </footer>
      {notice && (
        <div className="toast" role="status">
          <Check size={18} />
          {notice}
        </div>
      )}
      {selected && (
        <Modal title="تفاصيل المنتج" close={() => setSelected(null)}>
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
              onClick={() => add(selected)}
            >
              أضف إلى السلة <ShoppingBag size={18} />
            </button>
          </div>
        </Modal>
      )}
      {cartOpen && (
        <Modal title={`سلّتك (${count})`} close={() => setCartOpen(false)}>
          {!cart.length ? (
            <div className="empty">
              <ShoppingBag size={42} />
              <h3>سلّتك تنتظر اختياراتك</h3>
              <p>ابدئي بمنتجات العناية التي تحبينها.</p>
              <button className="primary" onClick={() => setCartOpen(false)}>
                تصفّح المنتجات
              </button>
            </div>
          ) : (
            <>
              <div className="cart-lines">
                {cart.map((item) => (
                  <div className="cart-line" key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <small>{money(item.price)} للقطعة</small>
                      {changes
                        .filter((c) => c.id === item.id)
                        .map((c) => (
                          <p className="field-error" key={c.id}>
                            {c.message}
                          </p>
                        ))}
                    </div>
                    <div className="quantity">
                      <button
                        aria-label={`تقليل ${item.name}`}
                        onClick={() => quantity(item.id, item.quantity - 1)}
                      >
                        <Minus size={15} />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        aria-label={`زيادة ${item.name}`}
                        disabled={item.quantity >= 99}
                        onClick={() => quantity(item.id, item.quantity + 1)}
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                    <button
                      className="remove"
                      onClick={() => quantity(item.id, 0)}
                      aria-label={`حذف ${item.name}`}
                    >
                      <X size={17} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="cart-total">
                <span>إجمالي المنتجات</span>
                <strong>{money(total)}</strong>
              </div>
              <p className="muted">
                رسوم التوصيل تُؤكَّد عبر واتساب. الطلب يُؤكَّد من الصيدلية بعد
                إرسال الرسالة.
              </p>
              <form onSubmit={checkout} className="form">
                <h3>إلى أين نوصّل عنايتك؟</h3>
                <label>
                  الاسم الكامل
                  <input
                    name="name"
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={100}
                  />
                </label>
                <label>
                  رقم الهاتف
                  <input
                    name="phone"
                    type="tel"
                    dir="ltr"
                    placeholder="07xxxxxxxxx"
                    autoComplete="tel"
                    required
                    maxLength={14}
                  />
                </label>
                <label>
                  عنوان التوصيل
                  <textarea
                    name="address"
                    autoComplete="street-address"
                    placeholder="المنطقة، الشارع، أقرب نقطة دالة"
                    required
                    minLength={8}
                    maxLength={500}
                  />
                </label>
                <label>
                  ملاحظات (اختياري)
                  <textarea name="notes" maxLength={1000} />
                </label>
                {error && (
                  <p className="field-error" role="alert">
                    {error}
                  </p>
                )}
                <button className="primary full" disabled={busy}>
                  {busy ? "جارٍ التحقق من المنتجات…" : "أرسل الطلب على واتساب"}
                  <MessageCircle size={18} />
                </button>
                {demo && (
                  <small>
                    في الوضع التجريبي ستظهر معاينة الرسالة فقط دون فتح واتساب.
                  </small>
                )}
              </form>
              {preview && (
                <div className="message-preview" role="status">
                  <h3>معاينة الرسالة التجريبية</h3>
                  <pre>{preview}</pre>
                </div>
              )}
            </>
          )}
        </Modal>
      )}
    </>
  );
}
function Modal({
  children,
  title,
  close,
}: {
  children: React.ReactNode;
  title: string;
  close: () => void;
}) {
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  }, [close]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const root = document.querySelector<HTMLElement>('[role="dialog"]');
    root?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab") {
        const els = root?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),a[href],input,textarea,select,[tabindex="0"]',
        );
        if (!els?.length) return;
        const first = els[0],
          last = els[els.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first || document.activeElement === root)
        ) {
          e.preventDefault();
          last.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last || document.activeElement === root)
        ) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="modal"
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button onClick={close} aria-label="إغلاق">
            <X />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
