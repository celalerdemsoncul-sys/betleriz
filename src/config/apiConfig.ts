import {Platform} from 'react-native';
export const API_CONFIG = {
  BASE_URL: Platform.OS === 'android' ? 'http://10.0.2.2:8000/api' : 'http://127.0.0.1:8000/api',
  ENDPOINTS: {
    TIPS: '/tips.php',
    SUPPORT: '/support.php',
    PAGES: '/pages.php',
    VERSION: '/version.php',
    NOTIFICATION: '/notification.php',
  },
  getTipsUrl: (cardType: string, date: string = 'today') =>
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TIPS}?cardType=${cardType}&date=${date}&_t=${Date.now()}&_r=${Math.random()}`,
  getAllTipsUrl: (date: string = 'today') =>
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TIPS}?allCards=true&date=${date}&_t=${Date.now()}&_r=${Math.random()}`,
  getSupportUrl: (page: string) =>
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SUPPORT}?page=${page}`,
  getPagesUrl: () => `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PAGES}`,
  getPageContentUrl: (pageId: string) =>
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PAGES}?action=content&page_id=${pageId}`,
  getVersionUrl: () =>
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VERSION}`,
  getNotificationUrl: () =>
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NOTIFICATION}`,
  getBaseUrl: () => API_CONFIG.BASE_URL,
};
