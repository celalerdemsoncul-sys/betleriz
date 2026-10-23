import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import { MixedVipIcon, BasketballIcon, TennisIcon, FootballTipsIcon, CorrectScoreIcon, HtFtIcon, StarterVipIcon, PremiumVipIcon, SingleTipsIcon, Daily20PlusOddsIcon, OverUnderIcon, BonusSurpriseIcon, FixedVipIcon, SpecialVipIcon, DailySureTipsIcon, Multi50PlusOddsIcon, Multi10PlusOddsIcon, StarIcon } from '../components/SvgIcons';
import Header from '../components/Header';
import HamburgerMenu from '../components/HamburgerMenu';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useResponsive } from '../hooks/useResponsive';
import { CARD_TYPE_MAPPING, PREMIUM_CARD_TYPES } from '../constants/endpoints';
import { usePremiumAccess } from '../hooks/usePremiumAccess';
import AnalyticsService from '../services/AnalyticsService';
import {
  isPremiumMonthlyProductId,
  isStarterMonthlyProductId,
} from '../domain/subscription/constants';
import {
  subscriptionPremiumPackageActive,
  subscriptionShowsPremiumStar,
  subscriptionShowsStarterStar,
  subscriptionStarterPackageActive,
} from '../domain/subscription/access';
type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;
const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { subscriptionStatus, refreshSubscription } = useSubscription();
  const { checkPremiumAccess } = usePremiumAccess();
  const { isTablet, isLargeTablet, getResponsiveValue } = useResponsive();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  useEffect(() => {
    AnalyticsService.logScreenView('HomeScreen', 'HomeScreen');
  }, []);
  const iconSize = getResponsiveValue(24, 32, 40);
  const cardPadding = getResponsiveValue(12, 18, 24);
  const cardMargin = getResponsiveValue(10, 15, 20);
  const titleFontSize = getResponsiveValue(14, 15, 17);
  const subtitleFontSize = getResponsiveValue(9, 10, 11);
  const vipLabelFontSize = getResponsiveValue(8, 10, 12);
  const purchaseLabelFontSize = getResponsiveValue(8, 10, 12);
  const styles = createStyles(isTablet, isLargeTablet);
  const handleCardPress = async (cardType: string) => {
    try {
      await AnalyticsService.logFeatureUsed(`card_pressed_${cardType.toLowerCase().replace(/\s+/g, '_')}`);
      if (cardType === 'Starter VIP' || cardType === 'Premium VIP') {
        navigation.navigate('VipPurchase');
        return;
      }
      const mappedCardType = CARD_TYPE_MAPPING[cardType as keyof typeof CARD_TYPE_MAPPING];
      if (!mappedCardType) {
        return;
      }
      const isVipCard = cardType.includes('VIP') && !cardType.includes('Starter') && !cardType.includes('Premium') ||
                       cardType === 'Multi 10+ Odds' || cardType === 'Multi 50+ Odds' || 
                       cardType === 'Correct Score' || cardType === 'HT-FT';
      if (isVipCard) {
        const hasVipAccess = subscriptionStatus.isActive && 
                            subscriptionStatus.expiryDate && 
                            new Date(subscriptionStatus.expiryDate) > new Date();
        if (!hasVipAccess) {
          navigation.navigate('VipPurchase');
          return;
        }
        const isStarterVipCard = cardType === 'Special VIP' || cardType === 'Fixed VIP' || cardType === 'Mixed VIP';
        const isPremiumVipCard = cardType === 'Single VIP' || cardType === 'Correct Score' || cardType === 'HT-FT' || 
                                cardType === 'Multi 50+ Odds' || cardType === 'Multi 10+ Odds';
        if (isStarterVipCard) {
          const hasStarterAccess =
            subscriptionStatus.starterVipActive ||
            isStarterMonthlyProductId(subscriptionStatus.subscription?.productId) ||
            subscriptionStatus.activeSubscriptions?.starter?.isActive;
          if (!hasStarterAccess) {
            navigation.navigate('VipPurchase');
            return;
          }
        }
        if (isPremiumVipCard) {
          const hasPremiumAccess =
            subscriptionStatus.premiumVipActive ||
            isPremiumMonthlyProductId(subscriptionStatus.subscription?.productId) ||
            subscriptionStatus.activeSubscriptions?.premium?.isActive;
          if (!hasPremiumAccess) {
            navigation.navigate('VipPurchase');
            return;
          }
        }
      }
      const hasAccess = checkPremiumAccess(mappedCardType, PREMIUM_CARD_TYPES);
      if (!hasAccess) {
        navigation.navigate('VipPurchase');
        return;
      }
      navigation.navigate('Tips', { 
        cardType: cardType
      });
    } catch (error) {
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground 
        source={{uri: 'background'}} 
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <Header
          title="Betleriz"
          onBackPress={() => {}}
          onMenuPress={() => setIsMenuVisible(true)}
          showBackButton={false}
        />
        <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* First row - 4 cards */}
        <View style={styles.actionCards}>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => handleCardPress('Daily Sure Tips')}
            >
              <DailySureTipsIcon width={iconSize} height={iconSize} color="#A855F7" />
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Daily Sure Tips</Text>
                <Text style={styles.actionSubtitle}>Guaranteed predictions</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => handleCardPress('Football Tips')}
            >
              <FootballTipsIcon width={iconSize} height={iconSize} color="#A855F7" />
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Football Tips</Text>
                <Text style={styles.actionSubtitle}>Soccer predictions</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => handleCardPress('Over-Under')}
            >
              <OverUnderIcon width={iconSize} height={iconSize} color="#A855F7" />
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Over-Under</Text>
                <Text style={styles.actionSubtitle}>Goal predictions</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => handleCardPress('Single Tips')}
            >
              <SingleTipsIcon width={iconSize} height={iconSize} color="#A855F7" />
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Single Tips</Text>
                <Text style={styles.actionSubtitle}>Individual bets</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        {/* Second row - 4 cards */}
        <View style={styles.actionCards}>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => handleCardPress('Daily 20+ Odds')}
            >
              <Daily20PlusOddsIcon width={iconSize} height={iconSize} color="#A855F7" />
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Daily 20+ Odds</Text>
                <Text style={styles.actionSubtitle}>High value bets</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => handleCardPress('Bonus-Surprise')}
            >
              <BonusSurpriseIcon width={iconSize} height={iconSize} color="#A855F7" />
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Bonus-Surprise</Text>
                <Text style={styles.actionSubtitle}>Special offers</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => handleCardPress('Basketball')}
            >
              <BasketballIcon width={iconSize} height={iconSize} color="#A855F7" />
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Basketball</Text>
                <Text style={styles.actionSubtitle}>NBA & EuroLeague</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => handleCardPress('Tennis')}
            >
              <TennisIcon width={iconSize} height={iconSize} color="#A855F7" />
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Tennis</Text>
                <Text style={styles.actionSubtitle}>ATP & WTA</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        {/* VIP Cards - First row - 4 cards */}
        <View style={styles.actionCards}>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.vipCard}
              onPress={() => handleCardPress('Special VIP')}
            >
              {subscriptionShowsStarterStar(subscriptionStatus) ? (
                <View style={[styles.vipLabel, { backgroundColor: '#A855F7' }]}>
                  <StarIcon width={12} height={12} color="#000000" />
                </View>
              ) : (
                <Text style={styles.vipLabel}>VIP</Text>
              )}
              <SpecialVipIcon width={iconSize} height={iconSize} color="#A855F7" />
              <View style={styles.actionTextContainer}>
                <Text style={styles.vipActionTitle}>Special VIP</Text>
                <Text style={styles.vipActionSubtitle}>Exclusive features</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.vipCard}
              onPress={() => handleCardPress('Fixed VIP')}
            >
              {subscriptionShowsStarterStar(subscriptionStatus) ? (
                <View style={[styles.vipLabel, { backgroundColor: '#A855F7' }]}>
                  <StarIcon width={12} height={12} color="#000000" />
                </View>
              ) : (
                <Text style={styles.vipLabel}>VIP</Text>
              )}
              <FixedVipIcon width={iconSize} height={iconSize} color="#A855F7" />
              <View style={styles.actionTextContainer}>
                <Text style={styles.vipActionTitle}>Fixed VIP</Text>
                <Text style={styles.vipActionSubtitle}>Guaranteed odds</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.vipCard}
              onPress={() => handleCardPress('Correct Score')}
            >
              {subscriptionShowsPremiumStar(subscriptionStatus) ? (
                <View style={[styles.vipLabel, { backgroundColor: '#A855F7' }]}>
                  <StarIcon width={12} height={12} color="#000000" />
                </View>
              ) : (
                <Text style={styles.vipLabel}>VIP</Text>
              )}
              <CorrectScoreIcon width={iconSize} height={iconSize} color="#A855F7" />
              <View style={styles.actionTextContainer}>
                <Text style={styles.vipActionTitle}>Correct Score</Text>
                <Text style={styles.vipActionSubtitle}>Exact score predictions</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.vipCard}
              onPress={() => handleCardPress('Mixed VIP')}
            >
              {subscriptionShowsStarterStar(subscriptionStatus) ? (
                <View style={[styles.vipLabel, { backgroundColor: '#A855F7' }]}>
                  <StarIcon width={12} height={12} color="#000000" />
                </View>
              ) : (
                <Text style={styles.vipLabel}>VIP</Text>
              )}
              <MixedVipIcon width={iconSize} height={iconSize} color="#A855F7" />
              <View style={styles.actionTextContainer}>
                <Text style={styles.vipActionTitle}>Mixed VIP</Text>
                <Text style={styles.vipActionSubtitle}>Combined bets</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        {/* VIP Cards - Second row - 4 cards */}
        <View style={styles.actionCards}>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.vipCard}
              onPress={() => handleCardPress('Multi 50+ Odds')}
            >
              {subscriptionShowsPremiumStar(subscriptionStatus) ? (
                <View style={[styles.vipLabel, { backgroundColor: '#A855F7' }]}>
                  <StarIcon width={12} height={12} color="#000000" />
                </View>
              ) : (
                <Text style={styles.vipLabel}>VIP</Text>
              )}
              <Multi50PlusOddsIcon width={iconSize} height={iconSize} color="#A855F7" />
              <View style={styles.actionTextContainer}>
                <Text style={styles.vipActionTitle}>Multi 50+ Odds</Text>
                <Text style={styles.vipActionSubtitle}>High value bets</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.vipCard}
              onPress={() => handleCardPress('Multi 10+ Odds')}
            >
              {subscriptionShowsPremiumStar(subscriptionStatus) ? (
                <View style={[styles.vipLabel, { backgroundColor: '#A855F7' }]}>
                  <StarIcon width={12} height={12} color="#000000" />
                </View>
              ) : (
                <Text style={styles.vipLabel}>VIP</Text>
              )}
              <Multi10PlusOddsIcon width={iconSize} height={iconSize} color="#A855F7" />
              <View style={styles.actionTextContainer}>
                <Text style={styles.vipActionTitle}>Multi 10+ Odds</Text>
                <Text style={styles.vipActionSubtitle}>Premium predictions</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.vipCard}
              onPress={() => handleCardPress('Single VIP')}
            >
              {subscriptionShowsPremiumStar(subscriptionStatus) ? (
                <View style={[styles.vipLabel, { backgroundColor: '#A855F7' }]}>
                  <StarIcon width={12} height={12} color="#000000" />
                </View>
              ) : (
                <Text style={styles.vipLabel}>VIP</Text>
              )}
              <SingleTipsIcon width={iconSize} height={iconSize} color="#A855F7" />
              <View style={styles.actionTextContainer}>
                <Text style={styles.vipActionTitle}>Single VIP</Text>
                <Text style={styles.vipActionSubtitle}>Individual predictions</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.vipCard}
              onPress={() => handleCardPress('HT-FT')}
            >
              {subscriptionShowsPremiumStar(subscriptionStatus) ? (
                <View style={[styles.vipLabel, { backgroundColor: '#A855F7' }]}>
                  <StarIcon width={12} height={12} color="#000000" />
                </View>
              ) : (
                <Text style={styles.vipLabel}>VIP</Text>
              )}
              <HtFtIcon width={iconSize} height={iconSize} color="#A855F7" />
              <View style={styles.actionTextContainer}>
                <Text style={styles.vipActionTitle}>HT-FT</Text>
                <Text style={styles.vipActionSubtitle}>Half time predictions</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        {/* VIP Package Cards - Always visible */}
        <View style={styles.actionCards}>
          <View style={isTablet ? styles.upgradeCardsContainer : styles.actionGrid}>
            <TouchableOpacity 
              style={styles.vipCard}
              onPress={() => handleCardPress('Starter VIP')}
            >
              {subscriptionStarterPackageActive(subscriptionStatus) ? (
                <View style={[styles.vipLabel, { backgroundColor: '#A855F7' }]}>
                  <StarIcon width={12} height={12} color="#000000" />
                </View>
              ) : (
                <Text style={[styles.vipLabel, { backgroundColor: '#A855F7', color: '#000000', fontWeight: '600' }]}>Upgrade</Text>
              )}
              <StarterVipIcon width={iconSize} height={iconSize} color="#A855F7" />
              <View style={styles.actionTextContainer}>
                <Text style={styles.vipActionTitle}>Starter VIP</Text>
                <Text style={styles.vipActionSubtitle}>
                  {subscriptionStarterPackageActive(subscriptionStatus)
                    ? 'Active - 3 VIP Features'
                    : 'Premium Features'}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.vipCard}
              onPress={() => handleCardPress('Premium VIP')}
            >
              {subscriptionPremiumPackageActive(subscriptionStatus) ? (
                <View style={[styles.vipLabel, { backgroundColor: '#A855F7' }]}>
                  <StarIcon width={12} height={12} color="#000000" />
                </View>
              ) : (
                <Text style={[styles.vipLabel, { backgroundColor: '#A855F7', color: '#000000', fontWeight: '600' }]}>Upgrade</Text>
              )}
              <PremiumVipIcon width={iconSize} height={iconSize} color="#A855F7" />
              <View style={styles.actionTextContainer}>
                <Text style={styles.vipActionTitle}>Premium VIP</Text>
                <Text style={styles.vipActionSubtitle}>
                  {subscriptionPremiumPackageActive(subscriptionStatus)
                    ? 'Active - All VIP Features'
                    : 'Ultimate Package'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        </ScrollView>
        <HamburgerMenu 
          visible={isMenuVisible}
          onClose={() => setIsMenuVisible(false)}
        />
      </ImageBackground>
    </SafeAreaView>
  );
};
const createStyles = (isTablet: boolean, isLargeTablet: boolean) => {
  const getResponsiveValue = (phone: number, tablet: number, largeTablet?: number) => {
    if (isLargeTablet && largeTablet !== undefined) return largeTablet;
    return isTablet ? tablet : phone;
  };
  const cardWidth = isTablet ? (isLargeTablet ? '22%' : '48%') : '48%';
  const cardPadding = getResponsiveValue(12, 18, 24);
  const cardMargin = getResponsiveValue(10, 15, 20);
  const titleFontSize = getResponsiveValue(14, 15, 17);
  const subtitleFontSize = getResponsiveValue(9, 10, 11);
  const vipLabelFontSize = getResponsiveValue(8, 10, 12);
  const purchaseLabelFontSize = getResponsiveValue(8, 10, 12);
  const borderRadius = getResponsiveValue(8, 12, 16);
  const marginHorizontal = getResponsiveValue(20, 30, 40);
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#101018',
    },
    backgroundImage: {
      flex: 1,
      width: '100%',
      height: '100%',
    },
    scrollContent: {
      paddingBottom: 20,
    },
    actionCards: {
      marginHorizontal: marginHorizontal,
      marginTop: 10, 
    },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
    actionCard: {
      backgroundColor: '#555555',
      width: cardWidth,
      padding: cardPadding,
      borderRadius: borderRadius,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8, 
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 2,
      position: 'relative',
      overflow: 'hidden',
      borderWidth: 0,
    },
    vipActionTitle: {
      fontSize: titleFontSize,
      fontWeight: 'bold',
      color: '#ffffff',
    },
    vipActionSubtitle: {
      fontSize: subtitleFontSize,
      color: '#ffffff',
      marginTop: 2,
    },
    actionTextContainer: {
      flex: 1,
      marginLeft: 4,
    },
    actionTitle: {
      fontSize: titleFontSize,
      fontWeight: 'bold',
      color: '#ffffff',
    },
    actionSubtitle: {
      fontSize: subtitleFontSize,
      color: '#cccccc',
      marginTop: 2,
    },
    vipCard: {
      backgroundColor: '#555555',
      width: cardWidth,
      padding: cardPadding,
      borderRadius: borderRadius,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8, 
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
      position: 'relative',
      overflow: 'hidden',
      borderWidth: 0,
    },
    vipLabel: {
      position: 'absolute',
      top: -1,
      right: -1,
      fontSize: vipLabelFontSize,
      fontWeight: '900',
      color: '#ffffff',
      backgroundColor: '#f97316',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 0,
      borderBottomLeftRadius: 10,
      zIndex: 1,
      minWidth: 24,
      textAlign: 'center',
      letterSpacing: 0.5,
      textShadowColor: 'rgba(0,0,0,0.3)',
      textShadowOffset: {width: 0, height: 1},
      textShadowRadius: 1,
    },
    purchaseLabel: {
      position: 'absolute',
      top: -1,
      right: -1,
      backgroundColor: '#d9ff4d',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 0,
      borderBottomLeftRadius: 10,
      zIndex: 1,
      minWidth: 24,
      textAlign: 'center',
      letterSpacing: 0.5,
      textShadowColor: 'rgba(0,0,0,0.3)',
      textShadowOffset: {width: 0, height: 1},
      textShadowRadius: 1,
    },
    purchaseLabelText: {
      fontSize: purchaseLabelFontSize,
      fontWeight: 'bold',
      color: '#101018',
    },
    vipActiveCard: {
      backgroundColor: '#2d5a27',
      width: cardWidth,
      padding: cardPadding,
      borderRadius: borderRadius,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: cardMargin,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
      position: 'relative',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#4ade80',
    },
    singleCardContainer: {
      width: '100%',
      alignItems: 'center',
    },
    upgradeCardsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    welcomeCard: {
      backgroundColor: '#21182F',
      width: '100%',
      maxWidth: 400,
      padding: cardPadding,
      borderRadius: borderRadius,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: cardMargin,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
      position: 'relative',
      overflow: 'visible',
      borderWidth: 1,
      borderColor: '#666666',
    },
    welcomeTextContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    welcomeTitle: {
      fontSize: titleFontSize,
      fontWeight: 'bold',
      color: '#ffffff',
    },
    welcomeSubtitle: {
      fontSize: subtitleFontSize,
      color: '#cccccc',
      marginTop: 2,
      fontWeight: '500',
    },
  });
};
export default HomeScreen;
