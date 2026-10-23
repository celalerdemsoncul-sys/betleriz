import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GooglePlaySubscriptionService } from '../services/GooglePlaySubscriptionService';
import { baseProductId, VIP_PRODUCT_IDS } from '../domain/subscription/constants';
import { parseSubscriptionPeriodToDays } from '../utils/subscriptionPeriod';
export interface SubscriptionStatus {
  isActive: boolean;
  expiryDate?: string;
  autoRenewing?: boolean;
  subscription?: any;
  starterVipActive?: boolean;
  premiumVipActive?: boolean;
  activeSubscriptions?: {
    starter?: {
      isActive: boolean;
      expiryDate?: string;
      autoRenewing?: boolean;
      subscription?: any;
    };
    premium?: {
      isActive: boolean;
      expiryDate?: string;
      autoRenewing?: boolean;
      subscription?: any;
    };
  };
}
interface SubscriptionContextType {
  subscriptionStatus: SubscriptionStatus;
  isLoading: boolean;
  checkSubscription: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  updateSubscriptionFromPurchase: (purchase: any, subscriptionPeriod?: string) => Promise<void>;
  simulateTestSubscription: (type: 'starter' | 'premium' | 'deactivate') => Promise<void>;
}
const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);
interface SubscriptionProviderProps {
  children: ReactNode;
}
export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    isActive: false,
    activeSubscriptions: {
      starter: undefined,
      premium: undefined,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const checkSubscription = async () => {
    try {
      const now = Date.now();
      const lastCheck = await AsyncStorage.getItem('lastSubscriptionCheck');
      if (lastCheck && (now - parseInt(lastCheck)) < 30000) { 
        return;
      }
      await AsyncStorage.setItem('lastSubscriptionCheck', now.toString());
      setIsLoading(true);

      const subscriptionData = await GooglePlaySubscriptionService.checkActiveSubscriptions();
      
      if (subscriptionData && subscriptionData.isActive) {
        setSubscriptionStatus({
          isActive: subscriptionData.isActive,
          expiryDate: subscriptionData.expiryDate,
          autoRenewing: subscriptionData.autoRenewing,
          subscription: subscriptionData.subscription,
          starterVipActive: subscriptionData.starterVipActive ?? false,
          premiumVipActive: subscriptionData.premiumVipActive ?? false,
          activeSubscriptions: subscriptionData.activeSubscriptions,
        });
        setIsLoading(false);
        return;
      }
      
      setSubscriptionStatus({ 
        isActive: false,
        activeSubscriptions: {
          starter: undefined,
          premium: undefined,
        },
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscriptionStatus({ 
        isActive: false,
        activeSubscriptions: {
          starter: undefined,
          premium: undefined,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };
  const refreshSubscription = async () => {
    await AsyncStorage.removeItem('lastSubscriptionCheck');
    setIsLoading(true);
    await checkSubscription();
  };

  const updateSubscriptionFromPurchase = async (purchase: any, subscriptionPeriod?: string) => {
    try {
      const purchaseData = purchase as any;
      const sku = baseProductId(String(purchaseData.productId ?? ''));
      const isPremium = sku === VIP_PRODUCT_IDS.PREMIUM_MONTHLY;
      const isStarter = sku === VIP_PRODUCT_IDS.STARTER_MONTHLY;

      if (!isPremium && !isStarter) {
        return;
      }

      const purchaseTimeMs = GooglePlaySubscriptionService.parseTransactionTimeMs(
        purchaseData.transactionDate,
      );
      const purchaseDate = new Date(purchaseTimeMs);
      const subscriptionDays = parseSubscriptionPeriodToDays(
        subscriptionPeriod || '',
        sku,
      );

      const expiryDate = new Date(
        purchaseDate.getTime() + subscriptionDays * 24 * 60 * 60 * 1000,
      );
      const now = new Date();

      if (Platform.OS !== 'android' && expiryDate <= now) {
        return;
      }

      const newSubscriptionData = {
        isActive: true,
        expiryDate: expiryDate.toISOString(),
        autoRenewing: purchaseData.autoRenewingAndroid ?? purchaseData.autoRenewing ?? true,
        subscription: {
          productId: sku,
          purchaseToken: purchaseData.purchaseToken || '',
          paymentState: purchaseData.paymentState ?? 1,
          transactionDate: purchaseTimeMs,
        },
      };

      setSubscriptionStatus(prev => {
        const currentStarter = prev.activeSubscriptions?.starter;
        const currentPremium = prev.activeSubscriptions?.premium;
        const updatedActiveSubscriptions = {
          starter: isStarter ? newSubscriptionData : currentStarter,
          premium: isPremium ? newSubscriptionData : currentPremium,
        };
        const starterExpiry = updatedActiveSubscriptions.starter?.expiryDate
          ? new Date(updatedActiveSubscriptions.starter.expiryDate)
          : null;
        const premiumExpiry = updatedActiveSubscriptions.premium?.expiryDate
          ? new Date(updatedActiveSubscriptions.premium.expiryDate)
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
            (updatedActiveSubscriptions.starter?.autoRenewing ?? false) ||
            (updatedActiveSubscriptions.premium?.autoRenewing ?? false),
          subscription:
            updatedActiveSubscriptions.premium?.subscription ||
            updatedActiveSubscriptions.starter?.subscription,
          starterVipActive: !!updatedActiveSubscriptions.starter,
          premiumVipActive: !!updatedActiveSubscriptions.premium,
          activeSubscriptions: updatedActiveSubscriptions,
        };
      });

      await AsyncStorage.removeItem('lastSubscriptionCheck');
    } catch (error) {
      console.error('Error updating subscription from purchase:', error);
    }
  };
  const simulateTestSubscription = async (type: 'starter' | 'premium' | 'deactivate') => {
    try {
      const now = new Date();
      let subscriptionData: SubscriptionStatus;
      if (type === 'deactivate') {
        subscriptionData = {
          isActive: false,
          expiryDate: undefined,
          autoRenewing: false,
          subscription: undefined,
          starterVipActive: false,
          premiumVipActive: false,
          activeSubscriptions: {
            starter: undefined,
            premium: undefined,
          },
        };
      } else {
        const expiryDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
        const productId =
          type === 'starter'
            ? VIP_PRODUCT_IDS.STARTER_MONTHLY
            : VIP_PRODUCT_IDS.PREMIUM_MONTHLY;
        const currentStarter = subscriptionStatus.starterVipActive ? subscriptionStatus.activeSubscriptions?.starter : undefined;
        const currentPremium = subscriptionStatus.premiumVipActive ? subscriptionStatus.activeSubscriptions?.premium : undefined;
        const newStarter = type === 'starter' ? {
          isActive: true,
          expiryDate: expiryDate.toISOString(),
          autoRenewing: true,
          subscription: {
            productId: productId,
            purchaseToken: `test_token_${Date.now()}`,
            paymentState: 1
          }
        } : currentStarter;
        const newPremium = type === 'premium' ? {
          isActive: true,
          expiryDate: expiryDate.toISOString(),
          autoRenewing: true,
          subscription: {
            productId: productId,
            purchaseToken: `test_token_${Date.now()}`,
            paymentState: 1
          }
        } : currentPremium;
        const starterActive = !!newStarter;
        const premiumActive = !!newPremium;
        const starterExpiry = newStarter ? new Date(newStarter.expiryDate!) : null;
        const premiumExpiry = newPremium ? new Date(newPremium.expiryDate!) : null;
        const latestExpiry = starterExpiry && premiumExpiry 
          ? (starterExpiry > premiumExpiry ? starterExpiry : premiumExpiry)
          : (starterExpiry || premiumExpiry);
        subscriptionData = {
          isActive: starterActive || premiumActive,
          expiryDate: latestExpiry?.toISOString(),
          autoRenewing: (starterActive ? newStarter?.autoRenewing : false) || (premiumActive ? newPremium?.autoRenewing : false),
          subscription: premiumActive ? newPremium?.subscription : newStarter?.subscription,
          starterVipActive: starterActive,
          premiumVipActive: premiumActive,
          activeSubscriptions: {
            starter: newStarter,
            premium: newPremium,
          },
        };
      }
      setSubscriptionStatus(subscriptionData);
      await AsyncStorage.setItem('testSubscriptionData', JSON.stringify(subscriptionData));
    } catch (error) {
      throw error;
    }
  };
  const checkSubscriptionRef = useRef(checkSubscription);
  checkSubscriptionRef.current = checkSubscription;

  useEffect(() => {
    checkSubscription();
  }, []);

  useEffect(() => {
    const onAppState = (state: AppStateStatus) => {
      if (state !== 'active') {
        return;
      }
      void AsyncStorage.removeItem('lastSubscriptionCheck').then(() =>
        checkSubscriptionRef.current(),
      );
    };
    const sub = AppState.addEventListener('change', onAppState);
    return () => sub.remove();
  }, []);
  const value: SubscriptionContextType = {
    subscriptionStatus,
    isLoading,
    checkSubscription,
    refreshSubscription,
    updateSubscriptionFromPurchase,
    simulateTestSubscription,
  };
  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
