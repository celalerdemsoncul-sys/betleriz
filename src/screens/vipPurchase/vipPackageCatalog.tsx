import React from 'react';
import {
  PremiumVipIcon,
  StarterVipIcon,
} from '../../components/SvgIcons';
import { VIP_PRODUCT_IDS } from '../../domain/subscription/constants';
import type { VipPackageBase } from './types';

export function createBaseVipPackages(iconSize: number): VipPackageBase[] {
  return [
    {
      id: 'premium',
      name: 'Premium VIP',
      duration: '30 Days',
      price: 'Loading...',
      productId: VIP_PRODUCT_IDS.PREMIUM_MONTHLY,
      features: [
        '✅ ALL VIP Features Unlocked',
        '✅ Special VIP Access',
        '✅ Fixed VIP Access',
        '✅ Mixed VIP Access',
        '✅ Correct Score Access',
        '✅ HT-FT Access',
        '✅ Multi 50+ Odds Access',
        '✅ Multi 10+ Odds Access',
        '✅ Single VIP Access',
        '✅ 30 Days Subscription',
      ],
      icon: <PremiumVipIcon width={iconSize} height={iconSize} color="#A855F7" />,
      popular: true,
    },
    {
      id: 'starter',
      name: 'Starter VIP',
      duration: '30 Days',
      price: 'Loading...',
      productId: VIP_PRODUCT_IDS.STARTER_MONTHLY,
      features: [
        '✅ 3 VIP Features Only',
        '✅ Special VIP Access',
        '✅ Fixed VIP Access',
        '✅ Mixed VIP Access',
        '❌ Correct Score (Premium Only)',
        '❌ HT-FT (Premium Only)',
        '❌ Multi 50+ Odds (Premium Only)',
        '❌ Multi 10+ Odds (Premium Only)',
        '❌ Single VIP (Premium Only)',
        '✅ 30 Days Subscription',
      ],
      icon: <StarterVipIcon width={iconSize} height={iconSize} color="#A855F7" />,
    },
  ];
}
