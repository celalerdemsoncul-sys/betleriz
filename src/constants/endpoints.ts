export const CARD_TYPE_MAPPING = {
  'Daily Sure Tips': 'daily-sure',
  'Football Tips': 'football',
  'Over-Under': 'over-under',
  'Single Tips': 'single',
  'Daily 20+ Odds': 'daily-odds',
  'Bonus-Surprise': 'bonus',
  'Basketball': 'basketball',
  'Tennis': 'tennis',
  'Special VIP': 'special',
  'Fixed VIP': 'fixed',
  'Correct Score': 'correct-score',
  'HT-FT': 'ht-ft',
  'Multi 50+ Odds': 'multi-50',
  'Multi 10+ Odds': 'multi-10',
  'Single VIP': 'single-vip',
  'Mixed VIP': 'mixed',
} as const;

export const PREMIUM_CARD_TYPES: string[] = [
  'special',
  'fixed',
  'correct-score',
  'ht-ft',
  'multi-50',
  'multi-10',
  'single-vip',
  'mixed',
];

export type CardTypeKey = keyof typeof CARD_TYPE_MAPPING;
export type CardTypeValue = (typeof CARD_TYPE_MAPPING)[CardTypeKey];
