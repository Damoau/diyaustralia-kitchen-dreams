import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wrench } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/pricing';
import { CabinetType } from '@/types/cabinet';

interface HardwareCostPreviewProps {
  cabinetType: CabinetType;
  selectedHardwareOptions: Record<string, string>;
  onHardwareChange: (options: Record<string, string>) => void;
  quantity?: number;
}

interface HardwareRequirement {
  id: string;
  hardware_type_id: string;
  units_per_scope: number;
  unit_scope: string;
  hardware_type: {
    name: string;
    category: string;
  };
  cabinet_hardware_options: Array<{
    id: string;
    hardware_brand_id: string;
    hardware_product_id: string;
    hardware_brand: {
      name: string;
    };
    hardware_product: {
      name: string;
      cost_per_unit: number;
    };
  }>;
}

interface HardwareCalculation {
  totalCost: number;
  breakdown: Array<{
    typeName: string;
    selectedBrand: string;
    selectedProduct: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }>;
}

export function HardwareCostPreview({ cabinetType, selectedHardwareOptions, onHardwareChange, quantity = 1 }: HardwareCostPreviewProps) {
  const [calculation, setCalculation] = useState<HardwareCalculation | null>(null);

  const { data: hardwareRequirements } = useQuery({
    queryKey: ['hardware-requirements-with-options', cabinetType.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cabinet_hardware_requirements')
        .select(`
          *,
          hardware_type:hardware_types(name, category),
          cabinet_hardware_options(
            *,
            hardware_brand:hardware_brands(name),
            hardware_product:hardware_products(name, cost_per_unit)
          )
        `)
        .eq('cabinet_type_id', cabinetType.id)
        .eq('active', true);

      if (error) throw error;
      return data as HardwareRequirement[];
    },
    enabled: !!cabinetType.id
  });

  useEffect(() => {
    if (hardwareRequirements && Object.keys(selectedHardwareOptions).length > 0) {
      // Calculate costs based on selected options
      let totalCost = 0;
      const breakdown: Array<{
        typeName: string;
        selectedBrand: string;
        selectedProduct: string;
        quantity: number;
        unitCost: number;
        totalCost: number;
      }> = [];

      hardwareRequirements.forEach(requirement => {
        const selectedOptionId = selectedHardwareOptions[requirement.id];
        const selectedOption = requirement.cabinet_hardware_options.find(opt => opt.id === selectedOptionId);
        
        if (selectedOption) {
          // Calculate quantity needed
          let quantityNeeded = requirement.units_per_scope;
          if (requirement.unit_scope === 'per_door') {
            quantityNeeded = quantityNeeded * (cabinetType.door_count || 0);
          } else if (requirement.unit_scope === 'per_drawer') {
            quantityNeeded = quantityNeeded * (cabinetType.drawer_count || 0);
          }
          
          // Multiply by cabinet quantity
          quantityNeeded = quantityNeeded * quantity;
          
          const itemCost = quantityNeeded * selectedOption.hardware_product.cost_per_unit;
          totalCost += itemCost;

          breakdown.push({
            typeName: requirement.hardware_type.name,
            selectedBrand: selectedOption.hardware_brand.name,
            selectedProduct: selectedOption.hardware_product.name,
            quantity: quantityNeeded,
            unitCost: selectedOption.hardware_product.cost_per_unit,
            totalCost: itemCost
          });
        }
      });

      setCalculation({
        totalCost,
        breakdown
      });
    }
  }, [hardwareRequirements, selectedHardwareOptions, cabinetType, quantity]);

  if (!hardwareRequirements || hardwareRequirements.length === 0) {
    return (
      <Card className="border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-yellow-600" />
            <span className="font-medium text-sm">No hardware requirements configured</span>
          </div>  
          <p className="text-xs text-muted-foreground mt-2">
            Configure hardware requirements in the admin panel first.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-950/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Wrench className="h-4 w-4 text-orange-600" />
          <span className="font-medium text-sm">Hardware Selection</span>
          {calculation && (
            <Badge variant="secondary" className="text-xs">
              Total: {formatPrice(calculation.totalCost)}
            </Badge>
          )}
        </div>
        
        <div className="space-y-4">
          {hardwareRequirements.map((requirement) => (
            <div key={requirement.id} className="space-y-2">
              <Label className="text-xs font-medium">
                {requirement.hardware_type.name} 
                <span className="text-muted-foreground ml-1">
                  ({requirement.units_per_scope} 
                  {requirement.unit_scope === 'per_door' && ' per door'}
                  {requirement.unit_scope === 'per_drawer' && ' per drawer'}
                  {requirement.unit_scope === 'per_cabinet' && ' per cabinet'})
                </span>
              </Label>
              
              {requirement.cabinet_hardware_options.length > 0 ? (
                <Select 
                  value={selectedHardwareOptions[requirement.id] || ''}
                  onValueChange={(value) => {
                    onHardwareChange({
                      ...selectedHardwareOptions,
                      [requirement.id]: value
                    });
                  }}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select brand & product" />
                  </SelectTrigger>
                  <SelectContent>
                    {requirement.cabinet_hardware_options.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        <div className="flex justify-between items-center w-full">
                          <span className="text-xs">
                            {option.hardware_brand.name} - {option.hardware_product.name}
                          </span>
                          <Badge variant="outline" className="text-xs ml-2">
                            {formatPrice(option.hardware_product.cost_per_unit)}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-xs text-muted-foreground p-2 border border-dashed rounded">
                  No options configured for this hardware type
                </div>
              )}
            </div>
          ))}
        </div>
        
        {calculation && calculation.breakdown.length > 0 && (
          <>
            <div className="mt-4 pt-3 border-t space-y-1">
              <div className="text-xs font-medium mb-2">Cost Breakdown:</div>
              {calculation.breakdown.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">
                    {item.quantity} × {item.selectedProduct} ({item.selectedBrand})
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
          </>
        )}
      </CardContent>
    </Card>
  );
}