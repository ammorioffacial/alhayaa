import { test } from "node:test";
import assert from "node:assert/strict";
import { computeAdminStats } from "../src/lib/admin-stats";
import { demoCategories, demoProducts } from "../src/lib/demo";
test("counts availability, featured, demo and images on the demo catalog", () => {
  const stats = computeAdminStats(demoProducts, demoCategories);
  assert.equal(stats.total, 6);
  assert.equal(stats.unavailable, 1);
  assert.equal(stats.available, 5);
  assert.equal(stats.featured, 4);
  assert.equal(stats.demo, 6);
  assert.equal(stats.withoutImage, 0);
});
test("price bands are inclusive and cover every product exactly once", () => {
  const stats = computeAdminStats(demoProducts, demoCategories);
  assert.equal(stats.priceBands.reduce((a, b) => a + b.count, 0), demoProducts.length);
  assert.equal(stats.minPrice, 18000);
  assert.equal(stats.maxPrice, 32000);
});
test("category counts follow the catalog order and sum to the total", () => {
  const stats = computeAdminStats(demoProducts, demoCategories);
  assert.equal(stats.byCategory.reduce((a, c) => a + c.count, 0), demoProducts.length);
  assert.equal(stats.byCategory[0].name, "العناية بالبشرة");
});
test("empty catalog returns zeros, not NaN", () => {
  const stats = computeAdminStats([], demoCategories);
  assert.equal(stats.total, 0);
  assert.equal(stats.averagePrice, 0);
  assert.equal(stats.minPrice, 0);
  assert.equal(stats.maxPrice, 0);
  assert.deepEqual(stats.topPriced, []);
});
test("needs-attention lists unavailable products and products without an image", () => {
  const withoutImage = { ...demoProducts[0], id: "x", image_url: "" };
  const stats = computeAdminStats([...demoProducts, withoutImage], demoCategories);
  assert.ok(stats.needsAttention.some((i) => i.reason === "غير متوفر للطلب"));
  assert.ok(stats.needsAttention.some((i) => i.reason === "بلا صورة"));
});
