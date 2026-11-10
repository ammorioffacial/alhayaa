import { test } from "node:test";
import assert from "node:assert/strict";
import { checkoutSchema, reviewOrder, productSchema } from "../src/lib/catalog";
import { demoCategories, demoProducts } from "../src/lib/demo";
const input = {
  customer: {
    name: "زبون تجريبي",
    phone: "07711191871",
    address: "بغداد، حي الجامعة، شارع ٦٦",
    notes: "الاتصال قبل الوصول",
  },
  items: [{ id: demoProducts[0].id, quantity: 2, price: 24000 }],
};
test("Arabic WhatsApp message is correctly encoded with quantities, unit and total prices", () => {
  const result = reviewOrder(checkoutSchema.parse(input), demoProducts);
  assert.equal(result.changes.length, 0);
  const url = new URL(result.url!);
  assert.equal(url.origin, "https://wa.me");
  assert.equal(url.pathname, "/9647711191871");
  const message = url.searchParams.get("text")!;
  assert.match(message, /زبون تجريبي/);
  assert.match(message, /× 2/);
  assert.match(message, /٤٨٬٠٠٠/);
  assert.match(message, /الاتصال قبل الوصول/);
});
test("changed price requires explicit second review", () => {
  const result = reviewOrder(
    input,
    demoProducts.map((p, i) => (i === 0 ? { ...p, price: 30000 } : p)),
  );
  assert.equal(result.url, null);
  assert.equal(result.changes[0].price, 30000);
});
test("unavailable or deleted products block checkout", () => {
  assert.equal(reviewOrder(input, []).url, null);
  assert.equal(
    reviewOrder(
      input,
      demoProducts.map((p) => ({ ...p, available: false })),
    ).changes[0].available,
    false,
  );
});
test("invalid phone, empty cart, repeated items, negative and excessive quantities are rejected", () => {
  assert.equal(
    checkoutSchema.safeParse({
      ...input,
      customer: { ...input.customer, phone: "123" },
    }).success,
    false,
  );
  for (const items of [
    [],
    [...input.items, ...input.items],
    [{ ...input.items[0], quantity: -1 }],
    [{ ...input.items[0], quantity: 100 }],
  ])
    assert.equal(checkoutSchema.safeParse({ ...input, items }).success, false);
});
test("product validation rejects invalid price, category and unsafe image URLs", () => {
  for (const change of [
    { price: -1 },
    { price: 1.5 },
    { category_id: "not-a-uuid" },
    { image_url: "javascript:alert(1)" },
  ])
    assert.equal(
      productSchema.safeParse({ ...demoProducts[0], ...change }).success,
      false,
    );
});
test("a product in a hidden category is refused at checkout, like an unavailable product", () => {
  const hidden = demoProducts.map((p, i) =>
    i === 0 ? { ...p, category: { ...demoCategories[0], is_visible: false } } : p,
  );
  const result = reviewOrder(checkoutSchema.parse(input), hidden);
  assert.equal(result.url, null);
  assert.equal(result.changes[0].available, false);
  assert.equal(result.changes[0].message, "لم يعد المنتج متاحاً، يرجى حذفه للمتابعة.");
});
test("a product with no category is refused at checkout", () => {
  const noCategory = demoProducts.map((p, i) => (i === 0 ? { ...p, category: null } : p));
  const result = reviewOrder(checkoutSchema.parse(input), noCategory);
  assert.equal(result.url, null);
  assert.equal(result.changes[0].available, false);
});
test("a product in a visible category is still orderable", () => {
  const result = reviewOrder(checkoutSchema.parse(input), demoProducts);
  assert.equal(result.changes.length, 0);
  assert.ok(result.url);
});
