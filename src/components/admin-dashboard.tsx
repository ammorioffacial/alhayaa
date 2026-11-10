"use client";
import { useMemo } from "react";
import { Boxes, CheckCircle2, PackageX, Sparkles } from "lucide-react";
import { formatPrice, type Category, type Product } from "@/lib/catalog";
import { computeAdminStats, nonEmptyPriceBands } from "@/lib/admin-stats";
import { ColumnChart, Donut, HorizontalBars } from "./admin-charts";
const digits = new Intl.NumberFormat("en-US");
export default function AdminDashboard({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const stats = useMemo(() => computeAdminStats(products, categories), [products, categories]);
  // Only price bands with at least one product are shown (owner decision).
  const bandsWithProducts = nonEmptyPriceBands(stats.priceBands);
  const kpis = [
    { label: "إجمالي المنتجات", value: digits.format(stats.total), icon: Boxes, tone: "navy" },
    { label: "متوفر للطلب", value: digits.format(stats.available), icon: CheckCircle2, tone: "success" },
    { label: "غير متوفر", value: digits.format(stats.unavailable), icon: PackageX, tone: "error" },
    { label: "منتجات مميزة", value: digits.format(stats.featured), icon: Sparkles, tone: "gold" },
  ];
  return (
    <section className="admin-dashboard" aria-labelledby="dash-title">
      <div className="dash-heading">
        <h2 id="dash-title">نظرة عامة</h2>
        <p>أرقام حيّة من كتالوج الصيدلية، تتحدّث عند كل حفظ.</p>
      </div>

      <div className="dash-kpis">
        {kpis.map((k) => (
          <article className={`dash-kpi dash-kpi-${k.tone}`} key={k.label}>
            <span className="dash-kpi-icon" aria-hidden="true">
              <k.icon size={20} strokeWidth={1.8} />
            </span>
            <div>
              <p>{k.label}</p>
              <strong>{k.value}</strong>
            </div>
          </article>
        ))}
      </div>

      {/* Row 2: categories (wide) and availability (narrow). */}
      <div className="dash-row">
        <article className="dash-card span-7">
          <h3>المنتجات حسب التصنيف</h3>
          <HorizontalBars
            label="عدد المنتجات في كل تصنيف"
            rows={stats.byCategory.map((c) => ({ label: c.name, value: c.count }))}
          />
        </article>
        <article className="dash-card span-5">
          <h3>حالة التوفر</h3>
          <Donut
            label="حالة توفر المنتجات"
            parts={[
              { label: "متوفر", value: stats.available, color: "#28715a" },
              { label: "غير متوفر", value: stats.unavailable, color: "#a13b3e" },
            ]}
          />
        </article>
      </div>

      {/* Row 3: price bands (wide) and a stack with the average price and the highest-priced products. */}
      <div className="dash-row">
        <article className="dash-card span-7">
          <h3>توزيع الأسعار</h3>
          {bandsWithProducts.length > 1 ? (
            <ColumnChart
              label="عدد المنتجات حسب نطاق السعر"
              columns={bandsWithProducts.map((b) => ({ label: b.label, value: b.count }))}
            />
          ) : bandsWithProducts.length === 1 ? (
            <p className="dash-note">كل المنتجات ضمن نطاق سعري واحد: {bandsWithProducts[0].label} د.ع.</p>
          ) : (
            <p className="dash-note">لا توجد منتجات بعد.</p>
          )}
          {stats.total > 0 && (
            <p className="dash-note">
              الأقل {formatPrice(stats.minPrice)} · الأعلى {formatPrice(stats.maxPrice)}
            </p>
          )}
        </article>
        <div className="dash-stack span-5">
          <article className="dash-card">
            <h3>متوسط السعر</h3>
            <strong className="dash-big">{stats.total ? formatPrice(stats.averagePrice) : "—"}</strong>
          </article>
          <article className="dash-card">
            <h3>الأعلى سعراً</h3>
            {stats.topPriced.length ? (
              <ol className="dash-list">
                {stats.topPriced.map((p) => (
                  <li key={p.id}>
                    <span>{p.name}</span>
                    <strong>{formatPrice(p.price)}</strong>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="dash-note">لا توجد منتجات بعد.</p>
            )}
          </article>
        </div>
      </div>

      {/* Row 4: needs attention, full width. */}
      <div className="dash-row">
        <article className="dash-card span-12">
          <h3>تحتاج انتباهك</h3>
          {stats.needsAttention.length ? (
            <ul className="dash-list">
              {stats.needsAttention.map((item, index) => (
                <li key={`${item.id}-${index}`}>
                  <span>{item.name}</span>
                  <strong className="dash-flag">{item.reason}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="dash-note">كل المنتجات متوفرة ولها صور.</p>
          )}
        </article>
      </div>
    </section>
  );
}
