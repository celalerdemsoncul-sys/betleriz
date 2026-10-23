import analytics from '@react-native-firebase/analytics';
class AnalyticsService {
  async initialize(): Promise<void> {
    try {
      await analytics().setAnalyticsCollectionEnabled(true);
      await this.logEvent('analytics_initialized', {
        timestamp: new Date().toISOString(),
        platform: 'android'
      });
    } catch (error) {
    }
  }
  async logScreenView(screenName: string, screenClass?: string): Promise<void> {
    try {
      await analytics().logEvent('screen_view', {
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });
    } catch (error) {
    }
  }
  async logEvent(eventName: string, parameters?: { [key: string]: any }): Promise<void> {
    try {
      await analytics().logEvent(eventName, parameters);
    } catch (error) {
    }
  }
  async setUserProperty(name: string, value: string): Promise<void> {
    try {
      await analytics().setUserProperty(name, value);
    } catch (error) {
    }
  }
  async setUserId(userId: string): Promise<void> {
    try {
      await analytics().setUserId(userId);
    } catch (error) {
    }
  }
  async logTipViewed(tipId: string, category: string): Promise<void> {
    await this.logEvent('tip_viewed', {
      tip_id: tipId,
      category: category,
    });
  }
  async logSubscriptionStarted(planType: string, price: number): Promise<void> {
    await this.logEvent('subscription_started', {
      plan_type: planType,
      price: price,
      currency: 'USD',
    });
  }
  async logSubscriptionCancelled(planType: string): Promise<void> {
    await this.logEvent('subscription_cancelled', {
      plan_type: planType,
    });
  }
  async logAppOpened(): Promise<void> {
    await this.logEvent('app_opened', {
      timestamp: new Date().toISOString(),
    });
  }
  async logFeatureUsed(featureName: string): Promise<void> {
    await this.logEvent('feature_used', {
      feature_name: featureName,
    });
  }
  async logError(errorMessage: string, errorCode?: string): Promise<void> {
    await this.logEvent('app_error', {
      error_message: errorMessage,
      error_code: errorCode || 'unknown',
    });
  }
}
export default new AnalyticsService();
