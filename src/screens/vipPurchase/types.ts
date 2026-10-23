import type React from 'react';

export interface VipPackage {
  id: string;
  name: string;
  duration: string;
  price: string;
  features: string[];
  icon: React.ReactNode;
  popular?: boolean;
  productId: string;
  localizedPrice?: string;
  currencyCode?: string;
  subscriptionPeriod?: string;
  daysDuration?: number;
}

export type VipPackageBase = Omit<
  VipPackage,
  'localizedPrice' | 'currencyCode' | 'subscriptionPeriod' | 'daysDuration'
>;
