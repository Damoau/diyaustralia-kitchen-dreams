import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MetaTag {
  id: string;
  page_type: 'static' | 'product' | 'category' | 'room' | 'custom';
  page_identifier: string;
  title: string;
  description: string;
  keywords?: string[];
  og_title?: string;
  og_description?: string;
  og_image?: string;
  twitter_card?: string;
  canonical_url?: string;
  robots?: string;
  structured_data?: any;
  is_active: boolean;
}

export function useMetaTags(pageType: string, pageIdentifier: string) {
  return useQuery({
    queryKey: ['meta-tags', pageType, pageIdentifier],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meta_tags')
        .select('*')
        .eq('page_type', pageType)
        .eq('page_identifier', pageIdentifier)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data as MetaTag | null;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

export function useAllMetaTags() {
  return useQuery({
    queryKey: ['meta-tags', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meta_tags')
        .select('*')
        .order('page_type', { ascending: true })
        .order('page_identifier', { ascending: true });

      if (error) throw error;
      return data as MetaTag[];
    },
  });
}
