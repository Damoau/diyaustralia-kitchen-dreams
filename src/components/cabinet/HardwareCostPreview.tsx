import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wrench } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/pricing';
import { CabinetType } from '@/types/cabinet';

interface HardwareCostPreviewProps {
  cabinetType: CabinetType;
  selectedHardwareBrand?: string;
  quantity?: number;
}

interface HardwareCalculation {
  brandName: string;
  totalCost: number;
  breakdown: Array<{
    typeName: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }>;
}

export function HardwareCostPreview({ cabinetType, selectedHardwareBrand, quantity = 1 }: HardwareCostPreviewProps) {
  const [calculation, setCalculation] = useState<HardwareCalculation | null>(null);

  const { data: hardwareData } = useQuery({
    queryKey: ['hardware-calculation', cabinetType.id, selectedHardwareBrand, quantity],
    queryFn: async () => {
      if (!selectedHardwareBrand) return null;

      // Get hardware requirements for this cabinet type
      const { data: requirements, error: reqError } = await supabase
        .from('cabinet_hardware_requirements')
        .select(`
          *,
          hardware_type:hardware_types(name)
        `)
        .eq('cabinet_type_id', cabinetType.id)
        .eq('active', true);

      if (reqError || !requirements) return null;

      // Get hardware products for the selected brand
      const { data: products, error: prodError } = await supabase
        .from('hardware_products')
        .select(`
          *,
          hardware_brand:hardware_brands(name),
          hardware_type:hardware_types(name)
        `)
        .eq('hardware_brand_id', selectedHardwareBrand)
        .eq('active', true);

      if (prodError || !products) return null;

      // Get brand name
      const { data: brand } = await supabase
        .from('hardware_brands')
        .select('name')
        .eq('id', selectedHardwareBrand)
        .single();

      if (!brand) return null;

      // Calculate costs
      let totalCost = 0;
      const breakdown: Array<{
        typeName: string;
        quantity: number;
        unitCost: number;
        totalCost: number;
      }> = [];

      requirements.forEach(requirement => {
        const product = products.find(p => p.hardware_type_id === requirement.hardware_type_id);
        
        if (product) {
          // Calculate quantity needed
          let quantityNeeded = requirement.units_per_scope;
          if (requirement.unit_scope === 'per_door') {
            quantityNeeded = quantityNeeded * (cabinetType.door_count || 0);
          } else if (requirement.unit_scope === 'per_drawer') {
            quantityNeeded = quantityNeeded * (cabinetType.drawer_count || 0);
          }
          
          // Multiply by cabinet quantity
          quantityNeeded = quantityNeeded * quantity;
          
          const itemCost = quantityNeeded * product.cost_per_unit;
          totalCost += itemCost;

          breakdown.push({
            typeName: requirement.hardware_type.name,
            quantity: quantityNeeded,
            unitCost: product.cost_per_unit,
            totalCost: itemCost
          });
        }
      });

      return {
        brandName: brand.name,
        totalCost,
        breakdown
      };
    },
    enabled: !!selectedHardwareBrand && !!cabinetType.id
  });

  useEffect(() => {
    setCalculation(hardwareData);
  }, [hardwareData]);

  if (!selectedHardwareBrand || !calculation) {
    return null;
  }

  return (
    <Card className="border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-950/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Wrench className="h-4 w-4 text-orange-600" />
          <span className="font-medium text-sm">Hardware Cost ({calculation.brandName})</span>
          <Badge variant="secondary" className="text-xs">
            {formatPrice(calculation.totalCost)}
          </Badge>
        </div>
        
        <div className="space-y-2 text-xs">
          {calculation.breakdown.map((item, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-muted-foreground">
                {item.quantity} × {item.typeName}
              </span>
              <span className="font-medium">
                {formatPrice(item.totalCost)}
              </span>
            </div>
          ))}
        </div>
        
        {quantity > 1 && (
          <div className="mt-2 pt-2 border-t border-orange-200 dark:border-orange-800">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">
                Per cabinet: {formatPrice(calculation.totalCost / quantity)}
              </span>
              <span className="text-muted-foreground">
                × {quantity} cabinets
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}