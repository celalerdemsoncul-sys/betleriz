import React from 'react';
import { View, Text, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import {
  SpecialVipIcon,
  FixedVipIcon,
  MixedVipIcon,
  CorrectScoreIcon,
  Multi50PlusOddsIcon,
  Multi10PlusOddsIcon,
  SingleTipsIcon,
  HtFtIcon,
} from '../../../components/SvgIcons';

export type BadgeDimensions = {
  itemWidth: number;
  fontSize: number;
  iconSize: number;
  paddingVertical: number;
  paddingHorizontal: number;
};

type IconComponent = React.ComponentType<{
  width: number;
  height: number;
  color: string;
}>;

const STARTER_ITEMS: { name: string; Icon: IconComponent }[] = [
  { name: 'Special VIP', Icon: SpecialVipIcon },
  { name: 'Fixed VIP', Icon: FixedVipIcon },
  { name: 'Mixed VIP', Icon: MixedVipIcon },
];

const PREMIUM_ITEMS: { name: string; Icon: IconComponent }[] = [
  { name: 'Correct Score', Icon: CorrectScoreIcon },
  { name: 'Multi 50+ Odds', Icon: Multi50PlusOddsIcon },
  { name: 'Multi 10+ Odds', Icon: Multi10PlusOddsIcon },
  { name: 'Single VIP', Icon: SingleTipsIcon },
  { name: 'HT-FT', Icon: HtFtIcon },
];

export type LockedPromoBadgeGridStyles = {
  lockedFeaturesContainer: ViewStyle;
  lockedFeaturesGrid: ViewStyle;
  lockedFeatureItem: ViewStyle;
  lockedFeatureText: TextStyle;
};

type Props = {
  variant: 'starter' | 'premium';
  badgeDimensions: BadgeDimensions;
  styles: LockedPromoBadgeGridStyles;
};

export function LockedPromoBadgeGrid({ variant, badgeDimensions, styles }: Props) {
  const items = variant === 'starter' ? STARTER_ITEMS : PREMIUM_ITEMS;

  return (
    <View style={styles.lockedFeaturesContainer}>
      <View style={styles.lockedFeaturesGrid}>
        {items.map((item, index) => {
          const FeatureIcon = item.Icon;
          return (
          <View
            key={`${item.name}-${index}`}
            style={[
              styles.lockedFeatureItem,
              {
                width: badgeDimensions.itemWidth,
                paddingVertical: badgeDimensions.paddingVertical,
                paddingHorizontal: badgeDimensions.paddingHorizontal,
              } as StyleProp<ViewStyle>,
            ]}>
            <FeatureIcon
              color="#A855F7"
              width={badgeDimensions.iconSize}
              height={badgeDimensions.iconSize}
            />
            <Text
              style={[
                styles.lockedFeatureText,
                { fontSize: badgeDimensions.fontSize } as StyleProp<TextStyle>,
              ]}>
              {item.name}
            </Text>
          </View>
          );
        })}
      </View>
    </View>
  );
}
