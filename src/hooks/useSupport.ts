import { useState, useEffect } from 'react';
import { API_CONFIG } from '../config/apiConfig';
interface SupportInfo {
  title: string;
  email: string;
  description: string;
  pageTitle?: string;
  pageDescription?: string;
}
interface SupportResponse {
  success: boolean;
  data: SupportInfo;
  page: string;
  timestamp: string;
}
export const useSupport = (page: string) => {
  const [supportInfo, setSupportInfo] = useState<SupportInfo | null>(null);
  useEffect(() => {
    const fetchSupportInfo = async () => {
      if (!page) return;
      try {
        const response = await fetch(API_CONFIG.getSupportUrl(page));
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result: SupportResponse = await response.json();
        if (result.success) {
          setSupportInfo(result.data);
        } else {
          throw new Error('Failed to fetch support info');
        }
      } catch (err) {
        setSupportInfo({
          title: 'For Support & More',
          email: 'superbettingtips@gmail.com',
          description: 'Get help with your betting journey'
        });
      }
    };
    fetchSupportInfo();
  }, [page]);
  return {
    supportInfo
  };
};
