/** Iraqi governorates offered at checkout. The keys are stored in the order; the values are shown to the customer. */
export const GOVERNORATE_NAMES = {
  baghdad: "بغداد",
  basra: "البصرة",
  nineveh: "نينوى",
  erbil: "أربيل",
  sulaymaniyah: "السليمانية",
  duhok: "دهوك",
  kirkuk: "كركوك",
  anbar: "الأنبار",
  babil: "بابل",
  karbala: "كربلاء",
  najaf: "النجف",
  diyala: "ديالى",
  wasit: "واسط",
  "salah-al-din": "صلاح الدين",
  maysan: "ميسان",
  "dhi-qar": "ذي قار",
  muthanna: "المثنى",
  qadisiyyah: "القادسية",
  halabja: "حلبجة",
} as const;
export type GovernorateId = keyof typeof GOVERNORATE_NAMES;
export const GOVERNORATE_IDS = Object.keys(GOVERNORATE_NAMES) as [GovernorateId, ...GovernorateId[]];
/** Delivery fee in IQD (owner decision): Baghdad 5,000; every other governorate 6,000. */
export const BAGHDAD_DELIVERY_FEE = 5000;
export const OTHER_GOVERNORATE_DELIVERY_FEE = 6000;
export function deliveryFee(id: GovernorateId): number {
  return id === "baghdad" ? BAGHDAD_DELIVERY_FEE : OTHER_GOVERNORATE_DELIVERY_FEE;
}
