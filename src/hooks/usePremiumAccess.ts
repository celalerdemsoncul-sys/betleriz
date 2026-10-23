import { useMemo } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import {
  isPremiumMonthlyProductId,
  isStarterMonthlyProductId,
} from '../domain/subscription/constants';
export const usePremiumAccess = () => {
  const { subscriptionStatus } = useSubscription();
  const hasAccess = useMemo(() => {
    const isActive = subscriptionStatus.isActive === true;
    const hasExpiryDate = !!subscriptionStatus.expiryDate;
    const isNotExpired = hasExpiryDate && subscriptionStatus.expiryDate && new Date(subscriptionStatus.expiryDate) > new Date();
    return isActive && hasExpiryDate && isNotExpired;
  }, [subscriptionStatus.isActive, subscriptionStatus.expiryDate]);
  const checkPremiumAccess = (endpoint: string, premiumEndpoints: string[]) => {
    if (!premiumEndpoints || !Array.isArray(premiumEndpoints)) {
      return true;
    }
    const isPremiumEndpoint = premiumEndpoints.includes(endpoint);
    if (!isPremiumEndpoint) {
      return true;
    }
    const starterEndpoints = ['special', 'fixed', 'mixed'];
    const isStarterEndpoint = starterEndpoints.includes(endpoint);
    const notExpired =
      subscriptionStatus.expiryDate &&
      new Date(subscriptionStatus.expiryDate) > new Date();
    const hasStarter =
      subscriptionStatus.starterVipActive ||
      subscriptionStatus.activeSubscriptions?.starter?.isActive ||
      (notExpired &&
        isStarterMonthlyProductId(subscriptionStatus.subscription?.productId));
    const hasPremium =
      subscriptionStatus.premiumVipActive ||
      subscriptionStatus.activeSubscriptions?.premium?.isActive ||
      (notExpired &&
        isPremiumMonthlyProductId(subscriptionStatus.subscription?.productId));
    if (isStarterEndpoint && hasStarter) {
      return true;
    }
    if (hasPremium) {
      return true;
    }
    return false;
  };
  return { 
    hasAccess, 
    subscriptionStatus,
    checkPremiumAccess
  };
};
