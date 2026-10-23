import { Linking, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { API_CONFIG } from '../config/apiConfig';

export type AppUpdateStatus = {
  updateRequired: boolean;
  currentVersion: string;
  minimumVersion: string;
};

type VersionApiResponse = {
  success?: boolean;
  minimumVersion?: string;
};

export class VersionCheckService {
  private static readonly PACKAGE_NAME = 'com.betleriz.app';
  private static readonly PLAY_STORE_URL = `market://details?id=${this.PACKAGE_NAME}`;
  private static readonly PLAY_STORE_WEB_URL = `https://play.google.com/store/apps/details?id=${this.PACKAGE_NAME}`;
  private static readonly APP_STORE_SEARCH_URL =
    'https://apps.apple.com/search?term=Super%20Betting%20Tips';

  private static readonly VERSION_FETCH_TIMEOUT_MS = 15000;

  private static compareVersions(
    currentVersion: string,
    minimumVersion: string,
  ): boolean {
    try {
      const current = currentVersion.split('.').map(Number);
      const minimum = minimumVersion.split('.').map(Number);

      for (let i = 0; i < Math.max(current.length, minimum.length); i++) {
        const currentPart = current[i] ?? 0;
        const minimumPart = minimum[i] ?? 0;

        if (currentPart < minimumPart) {
          return true;
        }
        if (currentPart > minimumPart) {
          return false;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  static async getUpdateStatus(): Promise<AppUpdateStatus | null> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      const currentVersion = await DeviceInfo.getVersion();
      const url = API_CONFIG.getVersionUrl();
      const controller = new AbortController();
      timeoutId = setTimeout(
        () => controller.abort(),
        this.VERSION_FETCH_TIMEOUT_MS,
      );

      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      if (!res.ok) {
        return null;
      }

      const text = await res.text();
      let data: VersionApiResponse;
      try {
        data = JSON.parse(text) as VersionApiResponse;
      } catch {
        return null;
      }

      const raw = data?.minimumVersion;
      if (!data?.success || typeof raw !== 'string' || raw.trim() === '') {
        return null;
      }

      const minimumVersion = raw.trim();
      const updateRequired = this.compareVersions(
        currentVersion,
        minimumVersion,
      );
      return {
        updateRequired,
        currentVersion,
        minimumVersion,
      };
    } catch (error) {
      const aborted =
        error instanceof Error && error.name === 'AbortError';
      if (!aborted) {
        console.error('Version check error:', error);
      }
      return null;
    } finally {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    }
  }

  static async openStore(): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        const market = this.PLAY_STORE_URL;
        const canMarket = await Linking.canOpenURL(market);
        if (canMarket) {
          await Linking.openURL(market);
          return;
        }
        await Linking.openURL(this.PLAY_STORE_WEB_URL);
        return;
      }

      const ios = this.APP_STORE_SEARCH_URL;
      if (await Linking.canOpenURL(ios)) {
        await Linking.openURL(ios);
      }
    } catch (error) {
      console.error('Error opening store:', error);
    }
  }
}
