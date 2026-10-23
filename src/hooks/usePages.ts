import { useState, useEffect } from 'react';
import { ApiService } from '../services/ApiService';
export interface Page {
  id: string;
  title: string;
  icon: string;
  url: string;
  order: number;
  active: boolean;
}
export interface PageContent {
  title: string;
  content: string;
  lastUpdated: string;
}
export const usePages = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchPages = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ApiService.getPages();
      setPages(data || []);
    } catch (err) {
      setError('Failed to fetch pages');
      setPages([]);
    } finally {
      setLoading(false);
    }
  };
  const fetchPageContent = async (pageId: string): Promise<PageContent | null> => {
    try {
      return await ApiService.getPageContent(pageId);
    } catch (err) {
      return null;
    }
  };
  useEffect(() => {
    fetchPages();
  }, []);
  return {
    pages,
    loading,
    error,
    fetchPages,
    fetchPageContent
  };
};
