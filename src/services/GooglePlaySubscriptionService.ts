import { Platform } from 'react-native';
import { getAvailablePurchases, Purchase } from 'react-native-iap';
import { baseProductId, VIP_PRODUCT_IDS } from '../domain/subscription/constants';
import { parseSubscriptionPeriodToDays } from '../utils/subscriptionPeriod';

export interface SubscriptionInfo {
  isActive: boolean;
  expiryDate?: string;
  autoRenewing?: boolean;
  subscription?: {
    productId: string;
    purchaseToken: string;
    paymentState: number;
    transactionDate: number;
  };
}

export interface ActiveSubscriptions {
  isActive: boolean;
  expiryDate?: string;
  autoRenewing?: boolean;
  subscription?: any;
  starterVipActive?: boolean;
  premiumVipActive?: boolean;
  activeSubscriptions?: {
    starter?: SubscriptionInfo;
    premium?: SubscriptionInfo;
  };
}

export class GooglePlaySubscriptionService {
  static parseTransactionTimeMs(raw: number | string | undefined | null): number {
    if (raw == null) {
      return Date.now();
    }
    const n = typeof raw === 'string' ? parseFloat(raw) : Number(raw);
    if (!Number.isFinite(n) || n <= 0) {
      return Date.now();
    }
    if (n < 1e12) {
      return Math.floor(n * 1000);
    }
    return Math.floor(n);
  }

  private static calculateExpiryDate(
    purchase: Purchase,
    subscriptionPeriod?: string,
  ): Date {
    const purchaseData = purchase as any;
    const purchaseTimeMs = this.parseTransactionTimeMs(
      purchase.transactionDate ?? purchaseData.transactionDateAndroid,
    );
    const purchaseDate = new Date(purchaseTimeMs);
    const days = parseSubscriptionPeriodToDays(
      subscriptionPeriod || '',
      baseProductId(purchase.productId),
    );
    return new Date(purchaseDate.getTime() + days * 24 * 60 * 60 * 1000);
  }

  private static purchaseToSubscriptionInfo(
    purchase: Purchase,
    subscriptionPeriod?: string,
  ): SubscriptionInfo {
    const calculatedExpiry = this.calculateExpiryDate(purchase, subscriptionPeriod);
    const now = new Date();
    const purchaseData = purchase as any;

    const baseId = baseProductId(purchase.productId);
    const txMs = this.parseTransactionTimeMs(
      purchase.transactionDate ?? purchaseData.transactionDateAndroid,
    );

    let expiryDate = calculatedExpiry;
    let isActive = calculatedExpiry > now;

    if (Platform.OS === 'android') {
      // getAvailablePurchases only returns valid subs; trust Play on Android.
      isActive = true;
      if (calculatedExpiry <= now) {
        expiryDate = new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000);
      }
    }

    return {
      isActive,
      expiryDate: expiryDate.toISOString(),
      autoRenewing: purchaseData.autoRenewingAndroid ?? purchaseData.autoRenewing ?? true,
      subscription: {
        productId: baseId,
        purchaseToken: purchase.purchaseToken || '',
        paymentState: purchaseData.paymentState ?? 1,
        transactionDate: txMs,
      },
    };
  }

  static async checkActiveSubscriptions(): Promise<ActiveSubscriptions> {
    try {
      const availablePurchases = await getAvailablePurchases({});

      if (!availablePurchases || availablePurchases.length === 0) {
        return {
          isActive: false,
          activeSubscriptions: {
            starter: undefined,
            premium: undefined,
          },
        };
      }

      const now = new Date();
      let starterSubscription: SubscriptionInfo | undefined;
      let premiumSubscription: SubscriptionInfo | undefined;

      for (const purchase of availablePurchases) {
        const productId = baseProductId(purchase.productId);
        const purchaseData = purchase as any;

        if (productId === VIP_PRODUCT_IDS.STARTER_MONTHLY) {
          const subscriptionInfo = this.purchaseToSubscriptionInfo(
            purchase,
            purchaseData.subscriptionPeriod,
          );
          if (subscriptionInfo.isActive) {
            starterSubscription = subscriptionInfo;
          }
        } else if (productId === VIP_PRODUCT_IDS.PREMIUM_MONTHLY) {
          const subscriptionInfo = this.purchaseToSubscriptionInfo(
            purchase,
            purchaseData.subscriptionPeriod,
          );
          if (subscriptionInfo.isActive) {
            premiumSubscription = subscriptionInfo;
          }
        }
      }

      const hasActiveSubscription = !!starterSubscription || !!premiumSubscription;

      if (!hasActiveSubscription) {
        return {
          isActive: false,
          activeSubscriptions: {
            starter: undefined,
            premium: undefined,
          },
        };
      }

      const starterExpiry = starterSubscription
        ? new Date(starterSubscription.expiryDate!)
        : null;
      const premiumExpiry = premiumSubscription
        ? new Date(premiumSubscription.expiryDate!)
        : null;

      const latestExpiry =
        starterExpiry && premiumExpiry
          ? starterExpiry > premiumExpiry
            ? starterExpiry
            : premiumExpiry
          : starterExpiry || premiumExpiry;

      return {
        isActive: true,
        expiryDate: latestExpiry?.toISOString(),
        autoRenewing:
          (starterSubscription?.autoRenewing ?? false) ||
          (premiumSubscription?.autoRenewing ?? false),
        subscription: premiumSubscription?.subscription || starterSubscription?.subscription,
        starterVipActive: !!starterSubscription,
        premiumVipActive: !!premiumSubscription,
        activeSubscriptions: {
          starter: starterSubscription,
          premium: premiumSubscription,
        },
      };
    } catch (error) {
      console.error('Error checking active subscriptions:', error);
      return {
        isActive: false,
        activeSubscriptions: {
          starter: undefined,
          premium: undefined,
        },
      };
    }
  }

  static async verifyPurchase(
    purchase: Purchase,
    subscriptionPeriod?: string,
  ): Promise<SubscriptionInfo> {
    return this.purchaseToSubscriptionInfo(purchase, subscriptionPeriod);
  }
}
