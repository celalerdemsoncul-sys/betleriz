import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, Permission } from 'react-native-permissions';
import { API_CONFIG } from '../config/apiConfig';

export interface NotificationData {
  title: string;
  body: string;
  data?: {
    [key: string]: string;
  };
}

class NotificationService {
  private fcmToken: string | null = null;
  private listeners: { [key: string]: Function[] } = {};

  on(event: string, callback: Function): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: Function): void {
    if (!this.listeners[event]) {
      return;
    }
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event: string, data?: any): void {
    if (!this.listeners[event]) {
      return;
    }
    this.listeners[event].forEach(callback => callback(data));
  }

  async initialize(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      this.fcmToken = token;
      await messaging().subscribeToTopic('notification');
      return token;
    } catch {
      return null;
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const androidVersion = Platform.Version;
        if (androidVersion >= 33) {
          const permission = 'android.permission.POST_NOTIFICATIONS' as Permission;
          const result = await check(permission);
          if (result === RESULTS.DENIED) {
            const requestResult = await request(permission);
            if (requestResult !== RESULTS.GRANTED) {
              return false;
            }
          } else if (result === RESULTS.BLOCKED || result === RESULTS.UNAVAILABLE) {
            return false;
          }
        }
      }
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      return enabled;
    } catch {
      return false;
    }
  }

  setupForegroundListener(): void {
    messaging().onMessage(async remoteMessage => {
      this.emit('foregroundNotification', {
        title: remoteMessage.notification?.title || 'Notification',
        body: remoteMessage.notification?.body || 'You have a new message',
        data: remoteMessage.data,
      });
    });
  }

  setupBackgroundListener(): void {
    messaging().setBackgroundMessageHandler(async () => {});
  }

  getToken(): string | null {
    return this.fcmToken;
  }

  async clearToken(): Promise<void> {
    try {
      if (this.fcmToken) {
        await fetch(API_CONFIG.getNotificationUrl(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'remove_token',
            token: this.fcmToken,
          }),
        });
      }
      this.fcmToken = null;
    } catch {
      /* ignore */
    }
  }
}

export default new NotificationService();
