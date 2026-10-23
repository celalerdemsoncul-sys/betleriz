import { VIP_PRODUCT_IDS } from '../../domain/subscription/constants';

export function getVipHeaderTitle(status: {
  isActive: boolean;
  starterVipActive?: boolean;
  premiumVipActive?: boolean;
}): string {
  if (!status.isActive) {
    return 'VIP Purchase';
  }
  if (status.starterVipActive && status.premiumVipActive) {
    return 'Both VIP Packages';
  }
  if (status.starterVipActive) {
    return 'Starter VIP';
  }
  return 'Premium VIP';
}

export function getActivePackageCardTitle(status: {
  starterVipActive?: boolean;
  premiumVipActive?: boolean;
}): string {
  if (status.starterVipActive && status.premiumVipActive) {
    return 'Both VIP Packages Active';
  }
  if (status.starterVipActive) {
    return 'Starter VIP Active';
  }
  return 'Premium VIP Active';
}

export function getActivePackageFeatureBlurb(status: {
  starterVipActive?: boolean;
  premiumVipActive?: boolean;
}): string {
  if (status.starterVipActive && status.premiumVipActive) {
    return 'You have access to ALL VIP features!';
  }
  if (status.starterVipActive) {
    return 'You have access to Starter VIP features!';
  }
  return 'You have access to all premium features!';
}

export function getAvailablePackagesSectionTitle(status: {
  starterVipActive?: boolean;
  premiumVipActive?: boolean;
}): string {
  if (status.starterVipActive && status.premiumVipActive) {
    return 'All packages are active!';
  }
  return 'Available for additional purchase:';
}

export function getPackageDashboardTitle(status: {
  isActive: boolean;
  expiryDate?: string;
  subscription?: { productId?: string };
}): string {
  if (!status.isActive || !status.expiryDate) {
    return 'VIP Dashboard';
  }
  const productId = status.subscription?.productId;
  if (productId === VIP_PRODUCT_IDS.STARTER_WEEKLY) {
    return 'Starter VIP Dashboard';
  }
  if (productId === VIP_PRODUCT_IDS.PREMIUM_MONTHLY) {
    return 'Premium VIP Dashboard';
  }
  const now = new Date();
  const expiry = new Date(status.expiryDate);
  const daysLeft = Math.ceil(
    (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  return daysLeft <= 7 ? 'Starter VIP Dashboard' : 'Premium VIP Dashboard';
}
