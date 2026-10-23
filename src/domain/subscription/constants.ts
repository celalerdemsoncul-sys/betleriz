/**
 * Play Billing ürün kimlikleri — tek kaynak (SKU eşlemesi).
 */
export const VIP_PRODUCT_IDS = {
  STARTER_MONTHLY: 'starter_vip_monthly',
  PREMIUM_MONTHLY: 'premium_vip_monthly',
  STARTER_WEEKLY: 'starter_vip_weekly',
} as const;

export type VipProductId =
  (typeof VIP_PRODUCT_IDS)[keyof typeof VIP_PRODUCT_IDS];

export const VIP_MONTHLY_SKUS = [
  VIP_PRODUCT_IDS.PREMIUM_MONTHLY,
  VIP_PRODUCT_IDS.STARTER_MONTHLY,
] as const;

/** Play Console'dan gelen tam productId (bazen basePlan suffix ile) → base SKU */
export function baseProductId(productId: string | undefined): string {
  if (!productId) {
    return '';
  }
  return productId.split(':')[0] ?? productId;
}

export function isVipMonthlySku(baseId: string): boolean {
  return (
    baseId === VIP_PRODUCT_IDS.STARTER_MONTHLY ||
    baseId === VIP_PRODUCT_IDS.PREMIUM_MONTHLY
  );
}

/** Play'den gelen tam productId (bazen `:basePlan` ile) Starter aylık SKU mu? */
export function isStarterMonthlyProductId(productId: string | undefined): boolean {
  return baseProductId(productId) === VIP_PRODUCT_IDS.STARTER_MONTHLY;
}

/** Play'den gelen tam productId Premium aylık SKU mu? */
export function isPremiumMonthlyProductId(productId: string | undefined): boolean {
  return baseProductId(productId) === VIP_PRODUCT_IDS.PREMIUM_MONTHLY;
}
