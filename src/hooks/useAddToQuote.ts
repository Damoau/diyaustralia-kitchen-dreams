import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CabinetType } from '@/types/cabinet';

interface HardwareProduct {
  id: string;
  name: string;
  cost_per_unit: number;
  hardware_brand?: {
    name: string;
  };
}

interface QuoteItemData {
  cabinetType: CabinetType;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  selectedDoorStyle: string;
  selectedColor: string;
  selectedFinish: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  assemblyOptions?: {
    enabled: boolean;
    type?: 'carcass_only' | 'with_doors';
    price?: number;
    postcode?: string;
  };
  hardwareSelections?: {
    hinges?: HardwareProduct | null;
    drawer_runners?: HardwareProduct | null;
  };
  itemName: string;
  jobReference?: string;
  notes?: string;
}

export const useAddToQuote = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addToQuote = async (itemData: QuoteItemData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get or create session ID for anonymous users
      let sessionId = null;
      if (!user) {
        sessionId = window.sessionStorage.getItem('quote_session_id') || 
                   crypto.randomUUID();
        window.sessionStorage.setItem('quote_session_id', sessionId);
      }

      // Check for existing quote or create new one
      let quote;
      
      if (user) {
        // For authenticated users, find existing draft quote
        const { data: existingQuotes } = await supabase
          .from('quotes')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'draft')
          .order('created_at', { ascending: false })
          .limit(1);
        
        quote = existingQuotes?.[0];
      } else {
        // For anonymous users, find existing session quote
        const { data: existingQuotes } = await supabase
          .from('quotes')
          .select('id')
          .eq('session_id', sessionId)
          .eq('status', 'draft')
          .order('created_at', { ascending: false })
          .limit(1);
        
        quote = existingQuotes?.[0];
      }

      // Create new quote if none exists
      if (!quote) {
        const { data: newQuote, error: quoteError } = await supabase
          .from('quotes')
          .insert({
            user_id: user?.id || null,
            session_id: sessionId,
            customer_email: user?.email || 'guest@example.com',
            status: 'draft'
          })
          .select()
          .single();

        if (quoteError) throw quoteError;
        quote = newQuote;
      }

      // Prepare hardware selections for storage
      const hardwareSelectionsData = {
        hinges: itemData.hardwareSelections?.hinges ? {
          id: itemData.hardwareSelections.hinges.id,
          name: itemData.hardwareSelections.hinges.name,
          cost_per_unit: itemData.hardwareSelections.hinges.cost_per_unit,
          brand: itemData.hardwareSelections.hinges.hardware_brand?.name
        } : null,
        drawer_runners: itemData.hardwareSelections?.drawer_runners ? {
          id: itemData.hardwareSelections.drawer_runners.id,
          name: itemData.hardwareSelections.drawer_runners.name,
          cost_per_unit: itemData.hardwareSelections.drawer_runners.cost_per_unit,
          brand: itemData.hardwareSelections.drawer_runners.hardware_brand?.name
        } : null
      };

      // Add item to quote
      const { error: itemError } = await supabase
        .from('quote_items')
        .insert({
          quote_id: quote.id,
          cabinet_type_id: itemData.cabinetType.id,
          door_style_id: itemData.selectedDoorStyle,
          color_id: itemData.selectedColor,
          finish_id: itemData.selectedFinish,
          width_mm: itemData.dimensions.width,
          height_mm: itemData.dimensions.height,
          depth_mm: itemData.dimensions.depth,
          quantity: itemData.quantity,
          unit_price: itemData.unitPrice,
          total_price: itemData.totalPrice,
          item_name: itemData.itemName,
          job_reference: itemData.jobReference,
          enhanced_notes: itemData.notes,
          hardware_selections: hardwareSelectionsData,
          configuration: {
            assembly: itemData.assemblyOptions,
            dimensions: itemData.dimensions,
            specifications: {
              door_style: itemData.selectedDoorStyle,
              color: itemData.selectedColor,
              finish: itemData.selectedFinish
            }
          }
        });

      if (itemError) throw itemError;

      toast({
        title: "Success",
        description: `"${itemData.itemName}" has been added to your quote`,
      });

      return { success: true, quoteId: quote.id };
    } catch (error) {
      console.error('Error adding to quote:', error);
      toast({
        title: "Error",
        description: "Failed to add item to quote",
        variant: "destructive"
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    addToQuote,
    loading
  };
};