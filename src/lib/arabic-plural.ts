// Arabic agreement for product counts. The number itself is always Western digits (0-9).
const western = new Intl.NumberFormat("en-US");
export function productCount(n: number): string {
  if (n === 0) return "لا توجد منتجات";
  if (n === 1) return "منتج واحد";
  if (n === 2) return "منتجان";
  if (n <= 10) return `${western.format(n)} منتجات`;
  return `${western.format(n)} منتجاً`;
}
