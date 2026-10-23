import { StyleSheet } from 'react-native';

export function createVipPurchaseStyles(
  isTablet: boolean,
  isLargeTablet: boolean,
) {
  const getResponsiveValue = (
    phone: number,
    tablet: number,
    largeTablet?: number,
  ) => {
    if (isLargeTablet && largeTablet !== undefined) {
      return largeTablet;
    }
    return isTablet ? tablet : phone;
  };
  const cardPadding = getResponsiveValue(16, 20, 24);
  const cardMargin = getResponsiveValue(10, 15, 20);
  const titleFontSize = getResponsiveValue(18, 22, 26);
  const subtitleFontSize = getResponsiveValue(14, 16, 18);
  const borderRadius = getResponsiveValue(12, 16, 20);
  const marginHorizontal = getResponsiveValue(20, 30, 40);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#252525',
    },
    backgroundImage: {
      flex: 1,
      width: '100%',
      height: '100%',
    },
    scrollContent: {
      paddingTop: 15,
      paddingBottom: 20,
    },
    titleSection: {
      backgroundColor: 'rgba(26, 26, 26, 0.8)',
      marginHorizontal: 20,
      marginBottom: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    mainTitle: {
      fontSize: titleFontSize,
      fontWeight: '600',
      color: '#e0ff55',
      marginBottom: 4,
    },
    subTitle: {
      fontSize: subtitleFontSize,
      fontWeight: '500',
      color: '#CCCCCC',
      textAlign: 'center',
    },
    packagesContainer: {
      marginHorizontal: marginHorizontal,
      marginTop: 8,
      gap: cardMargin,
    },
    activeSubscriptionsContainer: {
      gap: cardMargin,
    },
    availablePackagesContainer: {
      marginTop: 8,
      gap: cardMargin,
    },
    availablePackagesTitle: {
      fontSize: subtitleFontSize,
      fontWeight: 'bold',
      color: '#e0ff55',
      textAlign: 'center',
      marginBottom: 8,
    },
    packageCard: {
      backgroundColor: '#555555',
      borderRadius: borderRadius,
      padding: cardPadding,
      borderWidth: 2,
      borderColor: 'transparent',
      position: 'relative',
      marginBottom: cardMargin,
    },
    popularPackage: {
      borderColor: '#f97316',
    },
    popularBadge: {
      position: 'absolute',
      top: -8,
      right: 20,
      backgroundColor: '#f97316',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      zIndex: 1,
    },
    popularText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#ffffff',
      letterSpacing: 0.5,
    },
    packageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    packageIcon: {
      marginRight: 10,
    },
    packageInfo: {
      flex: 1,
    },
    packageNameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    packageName: {
      fontSize: titleFontSize,
      fontWeight: 'bold',
      color: '#ffffff',
      marginRight: 8,
    },
    packageDuration: {
      fontSize: subtitleFontSize,
      color: '#e0ff55',
      fontWeight: '600',
    },
    lockedFeaturesTitleContainer: {
      marginBottom: 4,
    },
    lockedFeaturesContainer: {
      marginBottom: 8,
    },
    lockedFeaturesTitle: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#CCCCCC',
      marginBottom: 6,
      textAlign: 'center',
    },
    lockedFeaturesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      width: '100%',
      alignItems: 'flex-start',
      gap: 4,
    },
    lockedFeatureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.3)',
      borderRadius: 4,
      minHeight: 24,
      width: '18%',
      marginBottom: 4,
      justifyContent: 'flex-start',
      paddingHorizontal: 2,
      paddingVertical: 2,
    },
    lockedFeatureText: {
      fontSize: 9,
      fontWeight: 'bold',
      color: '#cccccc',
      flex: 1,
      marginLeft: 4,
      textAlign: 'left',
    },
    activeFeatureItem: {
      backgroundColor: 'rgba(0,0,0,0.3)',
      marginBottom: 8,
    },
    activeFeatureText: {
      color: '#cccccc',
      fontWeight: 'bold',
    },
    purchaseButton: {
      backgroundColor: '#e0ff55',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
      alignItems: 'center',
      marginTop: 2,
      marginBottom: 2,
      position: 'relative',
      overflow: 'hidden',
    },
    purchaseButtonText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#2b2b2b',
      zIndex: 20,
      elevation: 20,
    },
    premiumButton: {
      backgroundColor: '#f97316',
    },
    premiumButtonText: {
      color: '#ffffff',
    },
    renewalTextContainer: {
      alignItems: 'center',
      marginTop: 4,
      marginBottom: 8,
    },
    renewalText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#CCCCCC',
      textAlign: 'center',
    },
    disabledButton: {
      opacity: 0.6,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginLeft: 8,
    },
    vipActiveCard: {
      borderColor: '#e0ff55',
      backgroundColor: '#4a4a4a',
    },
    vipActiveButton: {
      backgroundColor: '#e0ff55',
    },
    vipActiveButtonText: {
      color: '#2b2b2b',
      marginLeft: 6,
    },
    vipActiveButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    upgradeButton: {
      backgroundColor: '#f97316',
      marginTop: 8,
    },
    upgradeButtonText: {
      color: '#ffffff',
      fontWeight: 'bold',
    },
    manageSubscriptionsButton: {
      backgroundColor: '#e0ff55',
      marginTop: 4,
    },
    manageSubscriptionsButtonText: {
      color: '#2b2b2b',
    },
    unlockedFeatureItem: {
      backgroundColor: 'rgba(224, 255, 85, 0.2)',
    },
    unlockedFeatureText: {
      color: '#e0ff55',
    },
  });
}
