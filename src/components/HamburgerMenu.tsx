import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  Animated,
  Dimensions,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useSubscription } from '../contexts/SubscriptionContext';
import { CARD_TYPE_MAPPING, PREMIUM_CARD_TYPES } from '../constants/endpoints';
import { usePages } from '../hooks/usePages';
import { useResponsive } from '../hooks/useResponsive';
import {
  subscriptionShowsPremiumStar,
  subscriptionShowsStarterStar,
} from '../domain/subscription/access';
import { 
  DailySureTipsIcon, 
  FootballTipsIcon, 
  OverUnderIcon, 
  SingleTipsIcon, 
  Daily20PlusOddsIcon, 
  BonusSurpriseIcon, 
  BasketballIcon, 
  TennisIcon, 
  SpecialVipIcon, 
  FixedVipIcon, 
  CorrectScoreIcon, 
  HtFtIcon, 
  Multi50PlusOddsIcon, 
  Multi10PlusOddsIcon, 
  MixedVipIcon, 
  HomeIcon,
  LockIcon,
  CrownIcon,
  PrivacyIcon,
  TermsIcon,
  PageIcon
} from './SvgIcons';
interface HamburgerMenuProps {
  visible: boolean;
  onClose: () => void;
}
type NavigationProp = StackNavigationProp<RootStackParamList>;
const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ visible, onClose }) => {
  const navigation = useNavigation<NavigationProp>();
  const { subscriptionStatus } = useSubscription();
  const { pages, loading: pagesLoading } = usePages();
  const { isTablet, isLargeTablet, getResponsiveValue } = useResponsive();
  const slideAnim = React.useRef(new Animated.Value(Dimensions.get('window').width)).current;
  const menuWidth = getResponsiveValue(0.60, 0.45, 0.35); 
  const iconSize = getResponsiveValue(20, 24, 28);
  const fontSize = getResponsiveValue(14, 16, 18);
  const sectionFontSize = getResponsiveValue(12, 14, 16);
  const paddingHorizontal = getResponsiveValue(16, 20, 24);
  const paddingVertical = getResponsiveValue(8, 10, 12);
  const styles = createStyles(isTablet, isLargeTablet);
  const getCurrentRouteName = () => {
    const state = navigation.getState();
    return state.routes[state.index]?.name || 'Home';
  };
  const getCurrentRouteParams = () => {
    const state = navigation.getState();
    return state.routes[state.index]?.params || {};
  };
  const isMenuItemActive = (itemTitle: string, itemType: 'predictions' | 'vip' | 'premium' | 'pages') => {
    const params = getCurrentRouteParams();
    switch (itemType) {
      case 'predictions':
      case 'vip':
        return currentRoute === 'Tips' && (params as any).cardType === itemTitle;
      case 'premium':
        return currentRoute === 'VipPurchase';
      case 'pages':
        return currentRoute === 'PageContent' && (params as any).pageId === itemTitle;
      default:
        return false;
    }
  };
  const getPageIcon = (iconName: string, isActive: boolean) => {
    const color = isActive ? '#A855F7' : '#666666';
    const iconProps = { width: iconSize, height: iconSize, color };
    switch (iconName) {
      case 'privacy':
        return <PrivacyIcon {...iconProps} />;
      case 'terms':
        return <TermsIcon {...iconProps} />;
      default:
        return <PageIcon {...iconProps} />;
    }
  };
  const getIconColor = (isActive: boolean) => {
    return isActive ? '#A855F7' : '#666666';
  };
  const currentRoute = getCurrentRouteName();
  const currentParams = getCurrentRouteParams();
  React.useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('window').width,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);
  const isPremiumRequired = (endpoint: string) =>
    PREMIUM_CARD_TYPES.includes(endpoint);
  const hasPremiumAccess = (endpoint: string) => {
    if (!isPremiumRequired(endpoint)) return true;
    const isSubscriptionActive = subscriptionStatus.isActive === true;
    const hasValidExpiry = subscriptionStatus.expiryDate && 
                          new Date(subscriptionStatus.expiryDate) > new Date();
    return isSubscriptionActive && hasValidExpiry;
  };
  const hasStarterAccess = () =>
    subscriptionShowsStarterStar(subscriptionStatus);
  const hasPremiumVipAccess = () =>
    subscriptionShowsPremiumStar(subscriptionStatus);
  const hasVipFeatureAccess = (featureName: string) => {
    if (!hasStarterAccess() && !hasPremiumVipAccess()) return false;
    const starterVipFeatures = ['Special VIP', 'Fixed VIP', 'Mixed VIP'];
    const premiumVipFeatures = ['Correct Score', 'Multi 50+ Odds', 'Multi 10+ Odds', 'Single VIP', 'HT-FT'];
    if (hasPremiumVipAccess()) {
      return true; 
    }
    if (hasStarterAccess()) {
      return starterVipFeatures.includes(featureName);
    }
    return false;
  };
  const handleCardPress = (cardType: string) => {
    onClose();
    const endpoint = CARD_TYPE_MAPPING[cardType as keyof typeof CARD_TYPE_MAPPING];
    if (!endpoint) {
      return;
    }
    navigation.navigate('Tips', { 
      tipsData: undefined,
      endpoint: endpoint,
      cardType: cardType
    });
  };
  const predictionsItems = [
    {
      id: 'daily-sure-tips',
      title: 'Daily Sure Tips',
      icon: <DailySureTipsIcon width={iconSize} height={iconSize} color="#666666" />,
      onPress: () => handleCardPress('Daily Sure Tips'),
    },
    {
      id: 'football-tips',
      title: 'Football Tips',
      icon: <FootballTipsIcon width={iconSize} height={iconSize} color="#666666" />,
      onPress: () => handleCardPress('Football Tips'),
    },
    {
      id: 'over-under',
      title: 'Over-Under',
      icon: <OverUnderIcon width={iconSize} height={iconSize} color="#666666" />,
      onPress: () => handleCardPress('Over-Under'),
    },
    {
      id: 'single-tips',
      title: 'Single Tips',
      icon: <SingleTipsIcon width={iconSize} height={iconSize} color="#666666" />,
      onPress: () => handleCardPress('Single Tips'),
    },
    {
      id: 'daily-20-odds',
      title: 'Daily 20+ Odds',
      icon: <Daily20PlusOddsIcon width={iconSize} height={iconSize} color="#666666" />,
      onPress: () => handleCardPress('Daily 20+ Odds'),
    },
    {
      id: 'bonus-surprise',
      title: 'Bonus-Surprise',
      icon: <BonusSurpriseIcon width={iconSize} height={iconSize} color="#666666" />,
      onPress: () => handleCardPress('Bonus-Surprise'),
    },
    {
      id: 'basketball',
      title: 'Basketball',
      icon: <BasketballIcon width={iconSize} height={iconSize} color="#666666" />,
      onPress: () => handleCardPress('Basketball'),
    },
    {
      id: 'tennis',
      title: 'Tennis',
      icon: <TennisIcon width={iconSize} height={iconSize} color="#666666" />,
      onPress: () => handleCardPress('Tennis'),
    },
  ];
  const vipItems = [
    {
      id: 'special-vip',
      title: 'Special VIP',
      icon: <SpecialVipIcon width={iconSize} height={iconSize} color="#666666" />,
      onPress: () => handleCardPress('Special VIP'),
    },
    {
      id: 'fixed-vip',
      title: 'Fixed VIP',
      icon: <FixedVipIcon width={iconSize} height={iconSize} color="#666666" />,
      onPress: () => handleCardPress('Fixed VIP'),
    },
    {
      id: 'mixed-vip',
      title: 'Mixed VIP',
      icon: <MixedVipIcon width={iconSize} height={iconSize} color="#666666" />,
      onPress: () => handleCardPress('Mixed VIP'),
    },
    {
      id: 'correct-score',
      title: 'Correct Score',
      icon: <CorrectScoreIcon width={iconSize} height={iconSize} color="#666666" />,
      onPress: () => handleCardPress('Correct Score'),
    },
    {
      id: 'ht-ft',
      title: 'HT-FT',
      icon: <HtFtIcon width={iconSize} height={iconSize} color="#666666" />,
      onPress: () => handleCardPress('HT-FT'),
    },
    {
      id: 'multi-50-odds',
      title: 'Multi 50+ Odds',
      icon: <Multi50PlusOddsIcon width={iconSize} height={iconSize} color="#666666" />,
      onPress: () => handleCardPress('Multi 50+ Odds'),
    },
    {
      id: 'multi-10-odds',
      title: 'Multi 10+ Odds',
      icon: <Multi10PlusOddsIcon width={iconSize} height={iconSize} color="#666666" />,
      onPress: () => handleCardPress('Multi 10+ Odds'),
    },
    {
      id: 'single-vip',
      title: 'Single VIP',
      icon: <SingleTipsIcon width={iconSize} height={iconSize} color="#666666" />,
      onPress: () => handleCardPress('Single VIP'),
    },
  ];
  const premiumItems = [
    {
      id: 'vip-purchase',
      title: 'Premium',
      icon: <CrownIcon width={iconSize} height={iconSize} color="#666666" />,
      onPress: () => {
        onClose();
        navigation.navigate('VipPurchase');
      },
    },
  ];
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={() => {
        onClose();
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      }}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={() => {
            onClose();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
          }}
        />
        <Animated.View 
          style={[
            styles.menuContainer,
            { transform: [{ translateX: slideAnim }] }
          ]}
        >
          <ScrollView style={styles.menuItems} showsVerticalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.menuItem, currentRoute === 'Home' && styles.activeMenuItem]}
              onPress={() => {
                onClose();
                navigation.navigate('Home');
              }}
            >
              <View style={styles.menuItemIcon}>
                <HomeIcon width={iconSize} height={iconSize} color={currentRoute === 'Home' ? '#A855F7' : '#666666'} />
              </View>
              <Text style={[styles.menuItemText, currentRoute === 'Home' && styles.activeMenuItemText]}>Home</Text>
            </TouchableOpacity>
            {premiumItems.map((item) => {
              const isActive = isMenuItemActive(item.title, 'premium');
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.menuItem, isActive && styles.activeMenuItem]}
                  onPress={item.onPress}
                >
                  <View style={styles.menuItemIcon}>
                    {React.cloneElement(item.icon, {
                      color: getIconColor(isActive)
                    })}
                  </View>
                  <Text style={[styles.menuItemText, isActive && styles.activeMenuItemText]}>{item.title}</Text>
                </TouchableOpacity>
              );
            })}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Predictions</Text>
              {predictionsItems.map((item) => {
                const isActive = isMenuItemActive(item.title, 'predictions');
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.menuItem, isActive && styles.activeMenuItem]}
                    onPress={item.onPress}
                  >
                    <View style={styles.menuItemIcon}>
                      {typeof item.icon === 'string' ? (
                        <Text style={[styles.emojiIcon, isActive && styles.activeEmojiIcon]}>{item.icon}</Text>
                      ) : (
                        React.cloneElement(item.icon, {
                          color: getIconColor(isActive)
                        })
                      )}
                    </View>
                    <Text style={[styles.menuItemText, isActive && styles.activeMenuItemText]}>{item.title}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {hasStarterAccess() && hasPremiumVipAccess() 
                  ? 'Both VIP Packages' 
                  : hasStarterAccess() 
                    ? 'Starter VIP' 
                    : hasPremiumVipAccess() 
                      ? 'Premium VIP' 
                      : 'VIP Features'}
              </Text>
              {vipItems.map((item) => {
                const isActive = isMenuItemActive(item.title, 'vip');
                const hasAccess = hasVipFeatureAccess(item.title);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.menuItem, isActive && styles.activeMenuItem]}
                    onPress={hasAccess ? item.onPress : () => {
                      onClose();
                      navigation.navigate('VipPurchase');
                    }}
                  >
                    <View style={styles.menuItemIcon}>
                      {React.cloneElement(item.icon, {
                        color: hasAccess ? getIconColor(isActive) : '#666666'
                      })}
                    </View>
                    <Text style={[
                      styles.menuItemText, 
                      isActive && styles.activeMenuItemText,
                      !hasAccess && styles.lockedMenuItemText
                    ]}>
                      {item.title}
                    </Text>
                    <View style={styles.vipBadge}>
                      <LockIcon width={iconSize} height={iconSize} color={hasAccess ? "#A855F7" : "#666666"} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pages</Text>
              {!pagesLoading && pages && Array.isArray(pages) && pages.map((page) => {
                const isActive = isMenuItemActive(page.id, 'pages');
                return (
                  <TouchableOpacity
                    key={page.id}
                    style={[styles.menuItem, isActive && styles.activeMenuItem]}
                    onPress={() => {
                      onClose();
                      navigation.navigate('PageContent', { pageId: page.id });
                    }}
                  >
                    <View style={styles.menuItemIcon}>
                      {getPageIcon(page.icon, isActive)}
                    </View>
                    <Text style={[styles.menuItemText, isActive && styles.activeMenuItemText]}>{page.title}</Text>
                  </TouchableOpacity>
                );
              })}
              {pagesLoading && (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading pages...</Text>
                </View>
              )}
              {!pagesLoading && (!pages || !Array.isArray(pages)) && (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>No pages available</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};
const createStyles = (isTablet: boolean, isLargeTablet: boolean) => {
  const getResponsiveValue = (phone: number, tablet: number, largeTablet?: number) => {
    if (isLargeTablet && largeTablet !== undefined) return largeTablet;
    return isTablet ? tablet : phone;
  };
  const menuWidth = getResponsiveValue(0.60, 0.45, 0.35);
  const iconSize = getResponsiveValue(20, 24, 28);
  const fontSize = getResponsiveValue(14, 16, 18);
  const sectionFontSize = getResponsiveValue(12, 14, 16);
  const paddingHorizontal = getResponsiveValue(16, 20, 24);
  const paddingVertical = getResponsiveValue(8, 10, 12);
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    backdrop: {
      flex: 1,
    },
    menuContainer: {
      width: Dimensions.get('window').width * menuWidth,
      height: '100%',
      backgroundColor: '#101018',
      borderLeftWidth: 1,
      borderLeftColor: '#342640',
    },
    menuItems: {
      flex: 1,
      paddingTop: 10,
    },
    section: {
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: sectionFontSize,
      fontWeight: 'bold',
      color: '#A855F7',
      paddingHorizontal: paddingHorizontal,
      paddingVertical: paddingVertical,
      backgroundColor: '#2a2a2a',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: paddingHorizontal,
      paddingVertical: paddingVertical,
      borderBottomWidth: 0.5,
      borderBottomColor: '#2a2a2a',
    },
    menuItemIcon: {
      marginRight: 12,
      width: iconSize,
      height: iconSize,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emojiIcon: {
      fontSize: fontSize,
    },
    menuItemText: {
      flex: 1,
      fontSize: fontSize,
      color: '#ffffff',
      fontWeight: '400',
    },
  activeMenuItem: {
    backgroundColor: '#342640',
    borderLeftWidth: 3,
    borderLeftColor: '#A855F7',
  },
  activeMenuItemText: {
    color: '#A855F7',
    fontWeight: '600',
  },
  activeEmojiIcon: {
    opacity: 1,
  },
    vipBadge: {
      marginLeft: 8,
      justifyContent: 'center',
      alignItems: 'center',
      height: iconSize,
      width: iconSize,
    },
    loadingContainer: {
      padding: paddingHorizontal,
      alignItems: 'center',
    },
    loadingText: {
      color: '#666666',
      fontSize: fontSize,
    },
    lockedMenuItemText: {
      color: '#666666',
      opacity: 0.6,
    },
  });
};
export default HamburgerMenu;
