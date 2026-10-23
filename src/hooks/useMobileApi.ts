import { useState } from 'react';
import { ApiService } from '../services/ApiService';
import { useSubscription } from '../contexts/SubscriptionContext';
import { PREMIUM_CARD_TYPES } from '../constants/endpoints';

export const useMobileApi = () => {
  const { subscriptionStatus } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTips = async (cardType: string, date: string = 'today') => {
    setLoading(true);
    setError(null);
    try {
      const result = await ApiService.getTips(cardType, date);
      if (!result) {
        throw new Error('Empty response from API');
      }
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch tips';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const hasPremiumAccess = (cardType: string) => {
    if (!PREMIUM_CARD_TYPES.includes(cardType)) {
      return true;
    }
    return subscriptionStatus.isActive;
  };

  const isPremiumRequired = (cardType: string) =>
    PREMIUM_CARD_TYPES.includes(cardType);

  return {
    subscriptionStatus,
    loading,
    error,
    getTips,
    hasPremiumAccess,
    isPremiumRequired,
  };
};
