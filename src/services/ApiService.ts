import { API_CONFIG } from '../config/apiConfig';
import CryptoJS from 'react-native-crypto-js';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export class ApiService {
  private static readonly AES_KEY = 'SuperBettingTips2024!@#AES256Key';

  private static readonly JSON_HEADERS = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  } as const;

  private static decryptAESData(encryptedData: string): any {
    try {
      const encryptedObject = JSON.parse(
        CryptoJS.enc.Base64.parse(encryptedData).toString(CryptoJS.enc.Utf8),
      );
      if (!encryptedObject.data || !encryptedObject.iv) {
        throw new Error('Invalid encrypted data format');
      }
      const iv = CryptoJS.enc.Base64.parse(encryptedObject.iv);
      const decrypted = CryptoJS.AES.decrypt(
        encryptedObject.data,
        CryptoJS.enc.Utf8.parse(this.AES_KEY),
        {
          iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        },
      );
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      if (!decryptedString) {
        throw new Error('Failed to decrypt data');
      }
      return JSON.parse(decryptedString);
    } catch (error) {
      throw new Error(
        'Failed to decrypt data: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
      );
    }
  }

  private static async fetchEncryptedTips(url: string): Promise<any> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    let response: Response;
    try { response = await fetch(url, {method: 'GET', headers: {...this.JSON_HEADERS}, signal: controller.signal}); } finally { clearTimeout(timer); }
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
    }
    const responseText = await response.text();
    if (!responseText?.trim()) {
      throw new Error('Empty response from server');
    }
    if (responseText.startsWith('{')) {
      const errorData = JSON.parse(responseText);
      throw new Error(errorData.message || 'API Error');
    }
    return ApiService.decryptAESData(responseText);
  }

  static async get<T>(url: string): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    let response: Response;
    try { response = await fetch(url, {method: 'GET', headers: {...this.JSON_HEADERS}, signal: controller.signal}); } finally { clearTimeout(timer); }
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    return await response.json();
  }

  static async getTips(cardType: string, date: string = 'today') {
    return this.fetchEncryptedTips(API_CONFIG.getTipsUrl(cardType, date));
  }

  static async getAllTips(date: string = 'today') {
    return this.fetchEncryptedTips(API_CONFIG.getAllTipsUrl(date));
  }

  static async getSupport(page: string) {
    return ApiService.get(API_CONFIG.getSupportUrl(page));
  }

  static async getPages() {
    const data = await ApiService.get<any>(API_CONFIG.getPagesUrl());
    if (data.success && data.data) {
      return data.data;
    }
    throw new Error('Invalid response format from pages API');
  }

  static async getPageContent(pageId: string) {
    const data = await ApiService.get<any>(API_CONFIG.getPageContentUrl(pageId));
    if (data.success && data.data) {
      return data.data;
    }
    throw new Error('Invalid response format from page content API');
  }
}

export default ApiService;
