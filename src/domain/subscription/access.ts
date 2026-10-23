import {
  isPremiumMonthlyProductId,
  isStarterMonthlyProductId,
} from './constants';

export type SubscriptionAccessSlice = {
  isActive?: boolean;
  starterVipActive?: boolean;
  premiumVipActive?: boolean;
  subscription?: { productId?: string };
  activeSubscriptions?: {
    starter?: { isActive?: boolean };
    premium?: { isActive?: boolean };
  };
};

export function subscriptionShowsStarterStar(s: SubscriptionAccessSlice): boolean {
  return (
    !!s.starterVipActive ||
    !!s.activeSubscriptions?.starter?.isActive ||
    (!!s.isActive && isStarterMonthlyProductId(s.subscription?.productId))
  );
}

export function subscriptionShowsPremiumStar(s: SubscriptionAccessSlice): boolean {
  return (
    !!s.premiumVipActive ||
    !!s.activeSubscriptions?.premium?.isActive ||
    (!!s.isActive && isPremiumMonthlyProductId(s.subscription?.productId))
  );
}

export function subscriptionStarterPackageActive(s: SubscriptionAccessSlice): boolean {
  return (
    !!s.starterVipActive ||
    !!s.activeSubscriptions?.starter?.isActive ||
    isStarterMonthlyProductId(s.subscription?.productId)
  );
}

export function subscriptionPremiumPackageActive(s: SubscriptionAccessSlice): boolean {
  return (
    !!s.premiumVipActive ||
    !!s.activeSubscriptions?.premium?.isActive ||
    isPremiumMonthlyProductId(s.subscription?.productId)
  );
}
