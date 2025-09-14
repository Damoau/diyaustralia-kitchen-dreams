import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wrench } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/pricing';
import { CabinetType, HardwareBrand } from '@/types/cabinet';

interface HardwareBrandSelectorProps {
  cabinetType: CabinetType;
  selectedBrandId: string;
  onBrandChange: (brandId: string) => void;
  quantity?: number;
  compact?: boolean;
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
}

interface BrandCost {
  brandId: string;
  brandName: string;
  totalCost: number;
  breakdown: Array<{
    typeName: string;
    productName: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }>;
}

export function HardwareBrandSelector({ cabinetType, selectedBrandId, onBrandChange, quantity = 1, compact = false }: HardwareBrandSelectorProps) {
  const [brandCosts, setBrandCosts] = useState<Record<string, BrandCost>>({});

  const { data: hardwareBrands } = useQuery({
    queryKey: ['hardware-brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hardware_brands')
        .select('*')
        .eq('active', true)
        .order('name');
      if (error) throw error;
      return data as HardwareBrand[];
    }
  });

  const { data: hardwareRequirements } = useQuery({
    queryKey: ['cabinet-hardware-requirements', cabinetType.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cabinet_hardware_requirements')
        .select(`
          *,
          hardware_type:hardware_types(name, category)
        `)
        .eq('cabinet_type_id', cabinetType.id)
        .eq('active', true);
      if (error) throw error;
      return data as HardwareRequirement[];
    },
    enabled: !!cabinetType.id
  });

  const { data: hardwareProducts } = useQuery({
    queryKey: ['hardware-products-by-brand'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hardware_products')
        .select(`
          *,
          hardware_brand:hardware_brands(name),
          hardware_type:hardware_types(name)
        `)
        .eq('active', true);
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    if (hardwareBrands && hardwareRequirements && hardwareProducts) {
      const costs: Record<string, BrandCost> = {};

      hardwareBrands.forEach(brand => {
        let totalCost = 0;
        const breakdown: Array<{
          typeName: string;
          productName: string;
          quantity: number;
          unitCost: number;
          totalCost: number;
        }> = [];

        hardwareRequirements.forEach(requirement => {
          // Find the best product for this hardware type from this brand
          const brandProduct = hardwareProducts.find(product => 
            product.hardware_brand_id === brand.id && 
            product.hardware_type_id === requirement.hardware_type_id
          );

          if (brandProduct) {
            // Calculate quantity needed
            let quantityNeeded = requirement.units_per_scope;
            if (requirement.unit_scope === 'per_door') {
              quantityNeeded = quantityNeeded * (cabinetType.door_count || 0);
            } else if (requirement.unit_scope === 'per_drawer') {
              quantityNeeded = quantityNeeded * (cabinetType.drawer_count || 0);
            }
            
            // Multiply by cabinet quantity
            quantityNeeded = quantityNeeded * quantity;
            
            const itemCost = quantityNeeded * brandProduct.cost_per_unit;
            totalCost += itemCost;

            breakdown.push({
              typeName: requirement.hardware_type.name,
              productName: brandProduct.name,
              quantity: quantityNeeded,
              unitCost: brandProduct.cost_per_unit,
              totalCost: itemCost
            });
          }
        });

        costs[brand.id] = {
          brandId: brand.id,
          brandName: brand.name,
          totalCost,
          breakdown
        };
      });

      setBrandCosts(costs);
    }
  }, [hardwareBrands, hardwareRequirements, hardwareProducts, cabinetType, quantity]);

  // Auto-select first brand if none selected
  useEffect(() => {
    if (hardwareBrands && hardwareBrands.length > 0 && !selectedBrandId) {
      onBrandChange(hardwareBrands[0].id);
    }
  }, [hardwareBrands, selectedBrandId, onBrandChange]);

  if (!hardwareRequirements || hardwareRequirements.length === 0) {
    if (compact) {
      return (
        <div className="text-sm text-muted-foreground">
          No hardware requirements configured
        </div>
      );
    }
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

  if (!hardwareBrands || hardwareBrands.length === 0) {
    if (compact) {
      return (
        <div className="text-sm text-muted-foreground">
          No hardware brands available
        </div>
      );
    }
    return (
      <Card className="border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-yellow-600" />
            <span className="font-medium text-sm">No hardware brands available</span>
          </div>  
        </CardContent>
      </Card>
    );
  }

  const selectedBrandCost = brandCosts[selectedBrandId];

  if (compact) {
    return (
      <Select value={selectedBrandId} onValueChange={onBrandChange}>
        <SelectTrigger className="h-8">
          <SelectValue placeholder="Select hardware brand" />
        </SelectTrigger>
        <SelectContent>
          {hardwareBrands.map((brand) => {
            const cost = brandCosts[brand.id];
            return (
              <SelectItem key={brand.id} value={brand.id}>
                <div className="flex justify-between items-center w-full">
                  <span className="text-sm">{brand.name}</span>
                  {cost && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      {formatPrice(cost.totalCost)}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Card className="border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-950/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Wrench className="h-4 w-4 text-orange-600" />
          <span className="font-medium text-sm">Hardware Brand Selection</span>
          {selectedBrandCost && (
            <Badge variant="secondary" className="text-xs">
              Total: {formatPrice(selectedBrandCost.totalCost)}
            </Badge>
          )}
        </div>
        
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-medium">Choose Hardware Brand</Label>
            <Select value={selectedBrandId} onValueChange={onBrandChange}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select hardware brand" />
              </SelectTrigger>
              <SelectContent>
                {hardwareBrands.map((brand) => {
                  const cost = brandCosts[brand.id];
                  return (
                    <SelectItem key={brand.id} value={brand.id}>
                      <div className="flex justify-between items-center w-full">
                        <span>{brand.name}</span>
                        {cost && (
                          <Badge variant="outline" className="ml-2">
                            {formatPrice(cost.totalCost)}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {selectedBrandCost && selectedBrandCost.breakdown.length > 0 && (
          <>
            <div className="mt-4 pt-3 border-t space-y-1">
              <div className="text-xs font-medium mb-2">Cost Breakdown:</div>
              {selectedBrandCost.breakdown.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">
                    {item.quantity} × {item.productName}
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
                    Per cabinet: {formatPrice(selectedBrandCost.totalCost / quantity)}
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