import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ColorServiceFee {
  colorId: string;
  colorName: string;
  colorTotal: number;
  serviceFee: number;
  tier: 'tier1' | 'tier2' | 'none';
  minimumRequired: number;
}

export interface CartItem {
  color_id: string;
  total_price: number;
}

export const useColorServiceFees = (cartItems: CartItem[]) => {
  return useQuery({
    queryKey: ['color-service-fees', cartItems],
    queryFn: async () => {
      if (!cartItems?.length) return { fees: [], totalServiceFees: 0 };

      // Get unique color IDs
      const colorIds = [...new Set(cartItems.map(item => item.color_id))];
      
      // Fetch colors with service fee configurations
      const { data: colors } = await supabase
        .from('colors')
        .select(`
          id,
          name,
          minimum_order_amount,
          service_fee_tier1_max,
          service_fee_tier1_amount,
          service_fee_tier2_max,
          service_fee_tier2_amount
        `)
        .in('id', colorIds)
        .gt('minimum_order_amount', 0);

      const fees: ColorServiceFee[] = [];

      for (const color of colors || []) {
        // Calculate total for this color
        const colorTotal = cartItems
          .filter(item => item.color_id === color.id)
          .reduce((sum, item) => sum + item.total_price, 0);

        let serviceFee = 0;
        let tier: 'tier1' | 'tier2' | 'none' = 'none';

        // Check if color total is below minimum
        if (colorTotal < color.minimum_order_amount) {
          // Apply tier 1 fee (e.g., $100-$1,000 = $450)
          if (colorTotal <= color.service_fee_tier1_max) {
            serviceFee = color.service_fee_tier1_amount || 0;
            tier = 'tier1';
          }
          // Apply tier 2 fee (e.g., $1,000-$2,000 = $250)
          else if (colorTotal <= color.service_fee_tier2_max) {
            serviceFee = color.service_fee_tier2_amount || 0;
            tier = 'tier2';
          }
        }

        if (serviceFee > 0) {
          fees.push({
            colorId: color.id,
            colorName: color.name,
            colorTotal,
            serviceFee,
            tier,
            minimumRequired: color.minimum_order_amount
          });
        }
      }

      const totalServiceFees = fees.reduce((sum, fee) => sum + fee.serviceFee, 0);

      return { fees, totalServiceFees };
    },
    enabled: !!cartItems?.length
  });
};
