import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Animated,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useResponsive } from '../hooks/useResponsive';
import { CrownIcon } from '../components/SvgIcons';
import Header from '../components/Header';
import HamburgerMenu from '../components/HamburgerMenu';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useSupport } from '../hooks/useSupport';
import AnalyticsService from '../services/AnalyticsService';
import { GooglePlaySubscriptionService } from '../services/GooglePlaySubscriptionService';
import { baseProductId, VIP_PRODUCT_IDS } from '../domain/subscription/constants';
import { parseSubscriptionPeriodToDays } from '../utils/subscriptionPeriod';
import { useIAP, type Purchase } from 'react-native-iap';
import type { VipPackage } from './vipPurchase/types';
import { createBaseVipPackages } from './vipPurchase/vipPackageCatalog';
import { createVipPurchaseStyles } from './vipPurchase/VipPurchaseScreen.styles';
import {
  getActivePackageCardTitle,
  getActivePackageFeatureBlurb,
  getAvailablePackagesSectionTitle,
  getPackageDashboardTitle,
  getVipHeaderTitle,
} from './vipPurchase/vipPurchaseUiHelpers';
import { LockedPromoBadgeGrid } from './vipPurchase/components/LockedPromoBadgeGrid';

type VipPurchaseScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'VipPurchase'
>;

const VipPurchaseScreen: React.FC = () => {
  const navigation = useNavigation<VipPurchaseScreenNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'VipPurchase'>>();
  const returnTo = route.params?.returnTo;

  const { subscriptionStatus, refreshSubscription, updateSubscriptionFromPurchase } =
    useSubscription();
  const { supportInfo } = useSupport('vip-purchase');
  const { isTablet, isLargeTablet, getResponsiveValue } = useResponsive();

  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [loadingPackages, setLoadingPackages] = useState<Set<string>>(new Set());
  const purchaseSuccessHandlerRef = useRef<(p: Purchase) => Promise<void>>(
    async () => {},
  );
  const processedPurchaseTokensRef = useRef<Set<string>>(new Set());
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  const iconSize = getResponsiveValue(24, 28, 32);
  const styles = createVipPurchaseStyles(isTablet, isLargeTablet);

  const getBadgeDimensions = () => {
    if (isLargeTablet) {
      return {
        itemWidth: 120,
        fontSize: 11,
        iconSize: 20,
        paddingVertical: 2,
        paddingHorizontal: 2,
      };
    }
    if (isTablet) {
      return {
        itemWidth: 105,
        fontSize: 10,
        iconSize: 18,
        paddingVertical: 2,
        paddingHorizontal: 2,
      };
    }
    return {
      itemWidth: 90,
      fontSize: 9,
      iconSize: 16,
      paddingVertical: 2,
      paddingHorizontal: 2,
    };
  };
  const badgeDimensions = getBadgeDimensions();

  const {
    connected,
    products,
    subscriptions,
    availablePurchases,
    fetchProducts,
    requestPurchase,
    finishTransaction,
  } = useIAP({
    onPurchaseSuccess: purchase => purchaseSuccessHandlerRef.current(purchase),
  });

  const [isLoadingPrices, setIsLoadingPrices] = useState<boolean>(true);
  const baseVipPackages = useMemo(
    () => createBaseVipPackages(iconSize),
    [iconSize],
  );
  const [vipPackages, setVipPackages] = useState<VipPackage[]>([]);

  useEffect(() => {
    AnalyticsService.logScreenView('VipPurchaseScreen', 'VipPurchaseScreen');
  }, []);

  useEffect(() => {
    if (
      connected &&
      products.length === 0 &&
      subscriptions.length === 0 &&
      !isLoadingPrices
    ) {
      const productIds = baseVipPackages.map(pkg => pkg.productId);
      fetchProducts({ skus: productIds, type: 'subs' }).catch(() => {});
    }
  }, [connected, products.length, subscriptions.length, isLoadingPrices, vipPackages.length, fetchProducts, baseVipPackages]);

  useEffect(() => {
    const interval = setInterval(() => {
      void checkExistingSubscriptions();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const initialPackages = baseVipPackages.map(pkg => ({
      ...pkg,
      duration: '30 Days',
      daysDuration: 30,
      subscriptionPeriod: 'P1M',
      price: 'Price not available',
      localizedPrice: 'Price not available',
      currencyCode: 'USD',
    }));
    setVipPackages(initialPackages);
    setIsLoadingPrices(false);
  }, [iconSize]);

  useEffect(() => {
    if (connected) {
      const productIds = baseVipPackages.map(pkg => pkg.productId);
      const fetchAllProducts = async () => {
        try {
          await fetchProducts({ skus: productIds, type: 'subs' });
        } catch {
          /* Play yeniden dene */
        }
        try {
          await fetchProducts({ skus: productIds, type: 'in-app' });
        } catch {
          /* İn-app isteğe bağlı */
        }
        try {
          await checkExistingSubscriptions();
        } catch {
          /* Sessiz */
        }
      };
      void fetchAllProducts();
    }
  }, [connected, fetchProducts]);

  useEffect(() => {
    if (subscriptions.length > 0) {
      setIsLoadingPrices(false);
      setVipPackages(prevPackages =>
        prevPackages.map(pkg => {
          const subscription = subscriptions.find(
            sub => (sub as { id?: string }).id === pkg.productId,
          );
          if (subscription) {
            const sub = subscription as {
              subscriptionPeriod?: string;
              id?: string;
              displayPrice?: string;
              localizedPrice?: string;
              price?: string;
              currency?: string;
            };
            const days = parseSubscriptionPeriodToDays(
              sub.subscriptionPeriod ?? '',
              sub.id,
            );
            const duration = days > 0 ? `${days} Days` : pkg.duration;
            const googlePrice =
              sub.displayPrice || sub.localizedPrice || sub.price || 'Price not available';
            const googleCurrency = sub.currency || 'USD';
            return {
              ...pkg,
              name: pkg.name,
              localizedPrice: googlePrice,
              currencyCode: googleCurrency,
              price: googlePrice,
              duration,
              daysDuration: days > 0 ? days : pkg.daysDuration,
            };
          }
          return pkg;
        }),
      );
    } else if (products.length > 0) {
      setIsLoadingPrices(false);
      setVipPackages(prevPackages =>
        prevPackages.map(pkg => {
          const product = products.find(
            prod => (prod as { productId?: string }).productId === pkg.productId,
          );
          if (product) {
            const p = product as {
              localizedPrice?: string;
              price?: string;
              currency?: string;
              title?: string;
            };
            const googlePrice = p.localizedPrice || p.price || 'Price not available';
            const googleCurrency = p.currency || 'USD';
            return {
              ...pkg,
              name: p.title || pkg.name,
              localizedPrice: googlePrice,
              currencyCode: googleCurrency,
              price: googlePrice,
            };
          }
          return pkg;
        }),
      );
    } else if (connected && products.length === 0 && subscriptions.length === 0) {
      setVipPackages(prevPackages =>
        prevPackages.map(pkg => ({
          ...pkg,
          price:
            baseVipPackages.find(bp => bp.id === pkg.id)?.price ||
            'Price not available',
          localizedPrice:
            baseVipPackages.find(bp => bp.id === pkg.id)?.price ||
            'Price not available',
          currencyCode: 'USD',
        })),
      );
      setIsLoadingPrices(false);
    }
  }, [products, subscriptions, connected, baseVipPackages]);

  const formatPrice = (pkg: VipPackage) => {
    if (
      pkg.localizedPrice &&
      pkg.localizedPrice !== 'Price not available' &&
      pkg.localizedPrice !== 'Loading...'
    ) {
      return pkg.localizedPrice;
    }
    if (
      pkg.price &&
      pkg.price !== 'Loading...' &&
      pkg.price !== 'Price not available'
    ) {
      return pkg.price;
    }
    if (isLoadingPrices || pkg.price === 'Loading...') {
      return 'Loading...';
    }
    return 'Price not available';
  };

  useEffect(() => {
    const startPulse = () => {
      try {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnimation, {
              toValue: 1,
              duration: 3000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnimation, {
              toValue: 1.03,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnimation, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
        ).start();
      } catch {
        pulseAnimation.setValue(1);
      }
    };
    startPulse();
  }, [pulseAnimation]);

  const checkExistingSubscriptions = async () => {
    try {
      if (availablePurchases && availablePurchases.length > 0) {
        const activeSubscription = availablePurchases.find((purchase: Purchase) => {
          const productId = baseProductId(String(purchase.productId ?? ''));
          return (
            productId === VIP_PRODUCT_IDS.PREMIUM_MONTHLY ||
            productId === VIP_PRODUCT_IDS.STARTER_MONTHLY
          );
        });
        if (activeSubscription) {
          const purchase = activeSubscription as Purchase & {
            transactionDate?: number;
            productId: string;
            purchaseToken?: string;
          };
          const now = new Date();
          const purchaseDate = new Date(
            GooglePlaySubscriptionService.parseTransactionTimeMs(
              purchase.transactionDate,
            ),
          );
          const subscriptionDays = 30;
          const expiryDate = new Date(
            purchaseDate.getTime() + subscriptionDays * 24 * 60 * 60 * 1000,
          );
          return {
            isActive: now < expiryDate,
            expiryDate: expiryDate.toISOString(),
            autoRenewing: true,
            subscription: {
              productId: purchase.productId,
              purchaseToken: purchase.purchaseToken,
              paymentState: 1,
            },
          };
        }
      }
      return {
        isActive: false,
        expiryDate: undefined,
        autoRenewing: false,
        subscription: undefined,
      };
    } catch {
      await refreshSubscription();
      return null;
    }
  };

  const handlePurchaseUpdate = async (purchase: Purchase) => {
    try {
      const token =
        purchase.purchaseToken ?? (purchase as { purchaseTokenAndroid?: string }).purchaseTokenAndroid;
      if (token && processedPurchaseTokensRef.current.has(String(token))) {
        return;
      }
      await finishTransaction({ purchase, isConsumable: false });
      if (token) {
        processedPurchaseTokensRef.current.add(String(token));
      }
      const purchaseData = purchase as Purchase & { productId?: string; transactionDate?: number };

      try {
        const baseId = baseProductId(String(purchaseData.productId ?? ''));
        const subscriptionInfo = subscriptions.find(
          sub => (sub as { id?: string }).id === baseId,
        );
        const subscriptionPeriod = subscriptionInfo
          ? (subscriptionInfo as { subscriptionPeriod?: string }).subscriptionPeriod
          : undefined;

        const verificationResult = await GooglePlaySubscriptionService.verifyPurchase(
          purchase,
          subscriptionPeriod,
        );

        if (verificationResult.isActive && verificationResult.expiryDate) {
          await updateSubscriptionFromPurchase(purchase, subscriptionPeriod);
          setLoadingPackages(new Set());
          setTimeout(() => {
            refreshSubscription().catch(() => {});
          }, 2500);

          const planType = baseId;
          const price = (subscriptionInfo as { price?: number })?.price ?? 0;
          await AnalyticsService.logSubscriptionStarted(planType, price);

          const isPremium = baseId === VIP_PRODUCT_IDS.PREMIUM_MONTHLY;
          Alert.alert(
            '🎉 VIP Subscription Activated!',
            `Your ${isPremium ? 'Premium' : 'Starter'} VIP subscription has been activated successfully!\n\nYou now have access to ${isPremium ? 'all premium' : 'starter VIP'} features.`,
            [
              {
                text: 'Go to Home',
                onPress: () => navigation.navigate('Home'),
              },
            ],
          );
          return;
        }
      } catch (verifyError) {
        console.error('Subscription verification error:', verifyError);
      }

      const baseIdFallback = baseProductId(String(purchaseData.productId ?? ''));
      const subscriptionInfo = subscriptions.find(
        sub => (sub as { id?: string }).id === baseIdFallback,
      );

      const subInfo = subscriptionInfo as { subscriptionPeriod?: string } | undefined;
      await updateSubscriptionFromPurchase(
        purchase,
        subInfo?.subscriptionPeriod,
      );
      setTimeout(() => {
        refreshSubscription().catch(() => {});
      }, 2500);

      const planType = baseIdFallback;
      const price = (subscriptionInfo as { price?: number })?.price ?? 0;
      await AnalyticsService.logSubscriptionStarted(planType, price);

      setLoadingPackages(new Set());

      const isPremium = baseIdFallback === VIP_PRODUCT_IDS.PREMIUM_MONTHLY;
      Alert.alert(
        '🎉 VIP Subscription Activated!',
        `Your ${isPremium ? 'Premium' : 'Starter'} VIP subscription has been activated successfully!\n\nYou now have access to ${isPremium ? 'all premium' : 'starter VIP'} features.`,
        [
          {
            text: 'Go to Home',
            onPress: () => navigation.navigate('Home'),
          },
        ],
      );
    } catch (error) {
      setLoadingPackages(new Set());
      try {
        await finishTransaction({ purchase, isConsumable: false });
      } catch {
        /* zaten bitmiş olabilir */
      }
      Alert.alert(
        'Purchase Error',
        `Failed to process purchase: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }],
      );
    }
  };

  purchaseSuccessHandlerRef.current = handlePurchaseUpdate;

  const handleManageSubscriptions = () => {
    void Linking.openURL('https://play.google.com/store/account/subscriptions');
  };

  const resolvePackageForPurchase = (packageId: string) => {
    return (
      vipPackages.find(pkg => pkg.id === packageId) ??
      vipPackages.find(pkg => pkg.productId === packageId) ??
      baseVipPackages.find(pkg => pkg.id === packageId) ??
      baseVipPackages.find(pkg => pkg.productId === packageId)
    );
  };

  const handlePurchase = async (packageId: string) => {
    try {
      if (!connected) {
        Alert.alert(
          'Not Ready',
          'In-app purchases are still initializing. Please wait a moment and try again.',
          [{ text: 'OK' }],
        );
        return;
      }
      const packageData = resolvePackageForPurchase(packageId);
      if (!packageData) {
        return;
      }
      const availableProduct =
        subscriptions.find(sub => (sub as { id?: string }).id === packageData.productId) ||
        products.find(prod => (prod as { id?: string }).id === packageData.productId);
      if (!availableProduct) {
        Alert.alert(
          'Product Not Available',
          'This product is not available for purchase. Please check your internet connection and try again.',
          [{ text: 'OK' }],
        );
        return;
      }
      setLoadingPackages(prev => new Set(prev).add(packageId));
      const targetSubscription = subscriptions.find(
        s => (s as { id?: string }).id === packageData.productId,
      );
      if (!targetSubscription) {
        Alert.alert(
          'Product Not Available',
          'This product is not available for purchase. Please check your internet connection and try again.',
          [{ text: 'OK' }],
        );
        setLoadingPackages(prev => {
          const next = new Set(prev);
          next.delete(packageId);
          return next;
        });
        return;
      }
      try {
        await fetchProducts({ skus: [packageData.productId], type: 'subs' });
      } catch {
        /* */
      }
      let purchase: Purchase | Purchase[] | null | undefined;
      purchase = await requestPurchase({
        request: {
          android: {
            skus: [packageData.productId],
          },
        },
        type: 'subs',
      });
      if (purchase && !Array.isArray(purchase)) {
        await handlePurchaseUpdate(purchase);
      }
      setLoadingPackages(prev => {
        const next = new Set(prev);
        next.delete(packageId);
        return next;
      });
    } catch (error: unknown) {
      setLoadingPackages(prev => {
        const next = new Set(prev);
        next.delete(packageId);
        return next;
      });
      const err = error as { message?: string; code?: string };
      const errorMessage = err?.message ?? (err?.code ? `Error code: ${err.code}` : 'Unknown error');
      Alert.alert('Purchase Error', `Failed to process purchase: ${errorMessage}`, [{ text: 'OK' }]);
    }
  };

  const renderPurchaseButton = (
    pkg: VipPackage,
    ctaLabel: 'Join VIP Now' | 'Add Package',
  ) => {
    const labelPrefix = ctaLabel === 'Join VIP Now' ? 'Join VIP Now' : 'Add Package';
    const isPremiumPackage = pkg.popular;
    const loading = loadingPackages.has(pkg.id);

    if (isPremiumPackage) {
      return (
        <Animated.View style={{ transform: [{ scale: pulseAnimation }] }}>
          <View
            style={[
              styles.purchaseButton,
              styles.premiumButton,
              loading && styles.disabledButton,
            ]}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text
                  style={[
                    styles.purchaseButtonText,
                    styles.premiumButtonText,
                    styles.loadingText,
                  ]}>
                  Processing...
                </Text>
              </View>
            ) : (
              <Text style={[styles.purchaseButtonText, styles.premiumButtonText]}>
                {labelPrefix} - {formatPrice(pkg)}
              </Text>
            )}
          </View>
        </Animated.View>
      );
    }

    return (
      <View style={[styles.purchaseButton, loading && styles.disabledButton]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#191326" />
            <Text style={[styles.purchaseButtonText, styles.loadingText]}>
              Processing...
            </Text>
          </View>
        ) : (
          <Text style={styles.purchaseButtonText}>
            {labelPrefix} - {formatPrice(pkg)}
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={{ uri: 'background' }}
        style={styles.backgroundImage}
        resizeMode="cover">
        <Header
          title={getVipHeaderTitle(subscriptionStatus)}
          onBackPress={() => {
            if (returnTo) {
              navigation.navigate(returnTo as never);
            } else if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Home');
            }
          }}
          onMenuPress={() => setIsMenuVisible(true)}
        />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>
              {subscriptionStatus.isActive
                ? getPackageDashboardTitle(subscriptionStatus)
                : supportInfo?.pageTitle || 'Join VIP & Start Winning!'}
            </Text>
            <Text style={styles.subTitle}>
              {subscriptionStatus.isActive
                ? 'You have VIP access! Enjoy all premium features.'
                : supportInfo?.pageDescription ||
                  'Join 400+ WINNING VIP members with 97% success rate! Get 200+ daily odds! Unlock exclusive fixed matches now! Limited slots available!'}
            </Text>
          </View>
          <View style={styles.packagesContainer}>
            {subscriptionStatus.isActive ? (
              <View style={styles.activeSubscriptionsContainer}>
                <View style={[styles.packageCard, styles.vipActiveCard]}>
                  <View style={styles.packageHeader}>
                    <View style={styles.packageIcon}>
                      <CrownIcon width={32} height={32} color="#A855F7" />
                    </View>
                    <View style={styles.packageInfo}>
                      <View style={styles.packageNameContainer}>
                        <Text style={styles.packageName}>
                          {getActivePackageCardTitle(subscriptionStatus)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.lockedFeaturesTitleContainer}>
                    <Text style={styles.lockedFeaturesTitle}>
                      {getActivePackageFeatureBlurb(subscriptionStatus)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.purchaseButton, styles.manageSubscriptionsButton]}
                    onPress={handleManageSubscriptions}
                    activeOpacity={0.8}>
                    <Text
                      style={[
                        styles.purchaseButtonText,
                        styles.manageSubscriptionsButtonText,
                      ]}>
                      Manage Subscriptions
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.renewalTextContainer}>
                    <Text style={styles.renewalText}>
                      {subscriptionStatus.autoRenewing
                        ? 'Auto-renewal enabled'
                        : 'Manual renewal required'}
                    </Text>
                  </View>
                </View>

                <View style={styles.availablePackagesContainer}>
                  <Text style={styles.availablePackagesTitle}>
                    {getAvailablePackagesSectionTitle(subscriptionStatus)}
                  </Text>
                  {vipPackages.map(pkg => {
                    const isAlreadyActive =
                      (pkg.id === 'starter' && subscriptionStatus.starterVipActive) ||
                      (pkg.id === 'premium' && subscriptionStatus.premiumVipActive);
                    if (isAlreadyActive) {
                      return null;
                    }
                    return (
                      <TouchableOpacity
                        key={pkg.id}
                        style={[
                          styles.packageCard,
                          pkg.popular && styles.popularPackage,
                        ]}
                        onPress={() => handlePurchase(pkg.productId)}
                        activeOpacity={0.8}>
                        {pkg.popular && (
                          <View style={styles.popularBadge}>
                            <Text style={styles.popularText}>MOST POPULAR</Text>
                          </View>
                        )}
                        <View style={styles.packageHeader}>
                          <View style={styles.packageIcon}>{pkg.icon}</View>
                          <View style={styles.packageInfo}>
                            <View style={styles.packageNameContainer}>
                              <Text style={styles.packageName}>{pkg.name}</Text>
                              <Text style={styles.packageDuration}>{pkg.duration}</Text>
                            </View>
                          </View>
                        </View>
                        <View style={styles.lockedFeaturesTitleContainer}>
                          <Text style={styles.lockedFeaturesTitle}>
                            {pkg.id === 'starter'
                              ? 'Add Starter VIP features!'
                              : 'Add Premium VIP features!'}
                          </Text>
                        </View>
                        {renderPurchaseButton(pkg, 'Add Package')}
                        <View style={styles.renewalTextContainer}>
                          <Text style={styles.renewalText}>
                            Renews at {formatPrice(pkg)} - Limited Slots!
                          </Text>
                        </View>
                        <LockedPromoBadgeGrid
                          variant={pkg.id === 'starter' ? 'starter' : 'premium'}
                          badgeDimensions={badgeDimensions}
                          styles={{
                            lockedFeaturesContainer: styles.lockedFeaturesContainer,
                            lockedFeaturesGrid: styles.lockedFeaturesGrid,
                            lockedFeatureItem: styles.lockedFeatureItem,
                            lockedFeatureText: styles.lockedFeatureText,
                          }}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : (
              vipPackages.map(pkg => (
                <TouchableOpacity
                  key={pkg.id}
                  style={[styles.packageCard, pkg.popular && styles.popularPackage]}
                  onPress={() => handlePurchase(pkg.productId)}
                  activeOpacity={0.8}>
                  {pkg.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>MOST POPULAR</Text>
                    </View>
                  )}
                  <View style={styles.packageHeader}>
                    <View style={styles.packageIcon}>{pkg.icon}</View>
                    <View style={styles.packageInfo}>
                      <View style={styles.packageNameContainer}>
                        <Text style={styles.packageName}>
                          {((subscriptionStatus.starterVipActive && pkg.id === 'starter') ||
                            (subscriptionStatus.premiumVipActive && pkg.id === 'premium') ||
                            subscriptionStatus.subscription?.productId === pkg.productId)
                            ? `${pkg.name} (Active)`
                            : pkg.name}
                        </Text>
                        <Text style={styles.packageDuration}>{pkg.duration}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.lockedFeaturesTitleContainer}>
                    <Text style={styles.lockedFeaturesTitle}>
                      {pkg.id === 'starter'
                        ? 'Unlock Special, Fixed & Mixed VIP features!'
                        : 'Unlock Correct Score, Multi Odds & Single VIP features!'}
                    </Text>
                  </View>
                  {renderPurchaseButton(pkg, 'Join VIP Now')}
                  <View style={styles.renewalTextContainer}>
                    <Text style={styles.renewalText}>
                      Renews at {formatPrice(pkg)} - Limited Slots!
                    </Text>
                  </View>
                  <LockedPromoBadgeGrid
                    variant={pkg.id === 'starter' ? 'starter' : 'premium'}
                    badgeDimensions={badgeDimensions}
                    styles={{
                      lockedFeaturesContainer: styles.lockedFeaturesContainer,
                      lockedFeaturesGrid: styles.lockedFeaturesGrid,
                      lockedFeatureItem: styles.lockedFeatureItem,
                      lockedFeatureText: styles.lockedFeatureText,
                    }}
                  />
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
        <HamburgerMenu visible={isMenuVisible} onClose={() => setIsMenuVisible(false)} />
      </ImageBackground>
    </SafeAreaView>
  );
};

export default VipPurchaseScreen;
