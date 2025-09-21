import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Quote {
  id: string;
  quote_number: string;
  user_id: string;
  total_amount: number;
  status: string;
  valid_until: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  customer_details?: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
  };
  items?: QuoteItem[];
  version: number;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  cabinet_type_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  specifications: any;
}

export interface QuoteStats {
  total: number;
  pending: number;
  approved: number;
  totalValue: number;
}

export const useQuotes = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getQuotes = async (filters?: { status?: string; search?: string }) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from('quotes')
        .select(`
          *,
          quote_items(
            *,
            cabinet_types (
              name,
              category
            )
          )
        `)
        .order('created_at', { ascending: false });

      // Filter quotes for current user (either by user_id or customer_email if admin created)
      if (user) {
        query = query.or(`user_id.eq.${user.id},customer_email.eq.${user.email}`);
      }

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.or(`quote_number.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Format the data for the UI
      const formattedQuotes: Quote[] = data.map(quote => ({
        id: quote.id,
        quote_number: quote.quote_number || `QUO-${quote.id.slice(0, 8)}`,
        user_id: quote.user_id,
        total_amount: quote.total_amount || 0,
        status: quote.status || 'draft',
        valid_until: quote.valid_until,
        created_at: quote.created_at,
        updated_at: quote.updated_at,
        notes: quote.notes,
        version: quote.version_number || 1,
        customer_details: {
          name: quote.customer_name || 'Customer',
          email: quote.customer_email || 'customer@example.com',
          phone: quote.customer_phone,
          company: quote.customer_company
        },
        items: (quote.quote_items || []).map((item: any) => ({
          ...item,
          specifications: item.configuration || {}
        }))
      }));

      return formattedQuotes;
    } catch (error) {
      console.error('Error fetching quotes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch quotes",
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getQuoteStats = async (): Promise<QuoteStats> => {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('status, total_amount');

      if (error) throw error;

      const stats = data.reduce((acc, quote) => {
        acc.total++;
        if (quote.status === 'sent' || quote.status === 'draft') acc.pending++;
        if (quote.status === 'approved') acc.approved++;
        acc.totalValue += quote.total_amount || 0;
        return acc;
      }, { total: 0, pending: 0, approved: 0, totalValue: 0 });

      return stats;
    } catch (error) {
      console.error('Error fetching quote stats:', error);
      return { total: 0, pending: 0, approved: 0, totalValue: 0 };
    }
  };

  const updateQuoteStatus = async (quoteId: string, status: string, notes?: string) => {
    setLoading(true);
    try {
      const updateData: any = { 
        status, 
        updated_at: new Date().toISOString() 
      };
      
      if (notes) updateData.notes = notes;

      const { error } = await supabase
        .from('quotes')
        .update(updateData)
        .eq('id', quoteId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Quote status updated successfully"
      });

      return true;
    } catch (error) {
      console.error('Error updating quote status:', error);
      toast({
        title: "Error",
        description: "Failed to update quote status",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const convertQuoteToOrder = async (quoteId: string) => {
    setLoading(true);
    try {
      // For now, just update the status to indicate conversion
      // TODO: Implement proper conversion logic with edge function
      const { error } = await supabase
        .from('quotes')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', quoteId);

      if (error) throw error;

      toast({
        title: "Success", 
        description: "Quote marked as converted (full conversion coming soon)"
      });

      return true;
    } catch (error) {
      console.error('Error converting quote to order:', error);
      toast({
        title: "Error",
        description: "Failed to convert quote to order",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getQuotes,
    getQuoteStats,
    updateQuoteStatus,
    convertQuoteToOrder
  };
};