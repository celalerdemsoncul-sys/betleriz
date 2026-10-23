import { VIP_PRODUCT_IDS } from '../domain/subscription/constants';

/**
 * ISO 8601 abonelik süresi (örn. P1M) veya ürün kimliğinden gün sayısı.
 * GooglePlaySubscriptionService ve satın alma ekranı ortak kullanır.
 */
export function parseSubscriptionPeriodToDays(
  period: string,
  productId?: string,
): number {
  if (!period) {
    if (
      productId === VIP_PRODUCT_IDS.STARTER_MONTHLY ||
      productId === VIP_PRODUCT_IDS.PREMIUM_MONTHLY
    ) {
      return 30;
    }
    if (productId?.includes('monthly')) {
      return 30;
    }
    return 30;
  }

  const match = period.match(/P(\d+)([DMWY])/);
  if (!match) {
    return 30;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 'D':
      return value;
    case 'W':
      return value * 7;
    case 'M':
      return value * 30;
    case 'Y':
      return value * 365;
    default:
      return 30;
  }
}
