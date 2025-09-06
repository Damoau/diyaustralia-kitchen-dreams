import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Wrench } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/pricing';
import { CabinetType } from '@/types/cabinet';

interface HardwareBreakdownProps {
  cabinetType: CabinetType;
  selectedHardwareBrand?: string;
}

interface HardwareRequirement {
  id: string;
  hardware_type_id: string;
  units_per_scope: number;
  unit_scope: string;
  notes?: string;
  hardware_type: {
    name: string;
    category: string;
  };
}

interface HardwareProduct {
  id: string;
  name: string;
  model_number?: string;
  cost_per_unit: number;
  hardware_type_id: string;
  hardware_brand_id: string;
  hardware_brand: {
    name: string;
  };
}

export function HardwareBreakdown({ cabinetType, selectedHardwareBrand }: HardwareBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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
  });

  const { data: hardwareProducts } = useQuery({
    queryKey: ['hardware-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hardware_products')
        .select(`
          *,
          hardware_brand:hardware_brands(name)
        `)
        .eq('active', true);
      if (error) throw error;
      return data as HardwareProduct[];
    },
  });

  const { data: hardwareBrands } = useQuery({
    queryKey: ['hardware-brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hardware_brands')
        .select('*')
        .eq('active', true);
      if (error) throw error;
      return data;
    },
  });

  if (!hardwareRequirements || hardwareRequirements.length === 0) {
    return null;
  }

  // Calculate hardware costs for each brand
  const calculateHardwareCost = (brandId: string) => {
    let totalCost = 0;
    const breakdown: Array<{requirement: HardwareRequirement, product?: HardwareProduct, quantity: number, cost: number}> = [];

    hardwareRequirements.forEach(requirement => {
      // Find matching product for this brand and hardware type
      const product = hardwareProducts?.find(p => 
        p.hardware_type_id === requirement.hardware_type_id && 
        p.hardware_brand_id === brandId
      );

      // Calculate quantity needed (example: 4 door base needs 8 hinges, 4 handles)
      let quantity = requirement.units_per_scope;
      if (requirement.unit_scope === 'per_door') {
        quantity = quantity * (cabinetType.door_count || 0);
      } else if (requirement.unit_scope === 'per_drawer') {
        quantity = quantity * (cabinetType.drawer_count || 0);
      }

      const cost = product ? quantity * product.cost_per_unit : 0;
      totalCost += cost;

      breakdown.push({
        requirement,
        product,
        quantity,
        cost
      });
    });

    return { totalCost, breakdown };
  };

  const allBrands = hardwareBrands || [];
  const brandCalculations = allBrands.map(brand => ({
    brand,
    ...calculateHardwareCost(brand.id)
  }));

  const selectedBrandData = brandCalculations.find(b => b.brand.id === selectedHardwareBrand);

  return (
    <Card className="mb-6 border-l-4 border-l-orange-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wrench className="h-5 w-5 text-orange-500" />
            Hardware Requirements - {cabinetType.name}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Quick Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {brandCalculations.slice(0, 3).map(({ brand, totalCost, breakdown }) => (
            <div key={brand.id} className={`p-4 rounded-lg border-2 transition-all ${
              selectedHardwareBrand === brand.id 
                ? 'border-primary bg-primary/5' 
                : 'border-border bg-muted/20'
            }`}>
              <div className="text-center">
                <h4 className="font-semibold text-sm">{brand.name}</h4>
                <p className="text-2xl font-bold text-primary mt-1">{formatPrice(totalCost)}</p>
                <p className="text-xs text-muted-foreground">hardware cost</p>
              </div>
            </div>
          ))}
        </div>

        {isExpanded && (
          <>
            <Separator className="my-4" />
            
            {/* Detailed Breakdown */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <span>Detailed Hardware Breakdown</span>
                {selectedBrandData && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedBrandData.brand.name} Selected
                  </Badge>
                )}
              </h4>

              {selectedBrandData && (
                <div className="space-y-3">
                  {selectedBrandData.breakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {item.requirement.hardware_type.name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {item.requirement.hardware_type.category}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {item.product ? (
                            <>
                              {item.product.name} 
                              {item.product.model_number && ` (${item.product.model_number})`}
                              {' • '}
                              {item.quantity} × {formatPrice(item.product.cost_per_unit)} each
                            </>
                          ) : (
                            `No product found for ${selectedBrandData.brand.name}`
                          )}
                        </div>
                        {item.requirement.notes && (
                          <div className="text-xs text-muted-foreground italic mt-1">
                            {item.requirement.notes}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatPrice(item.cost)}</div>
                        <div className="text-xs text-muted-foreground">{item.quantity} units</div>
                      </div>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                    <span className="font-semibold">Total Hardware Cost ({selectedBrandData.brand.name})</span>
                    <span className="text-xl font-bold text-primary">
                      {formatPrice(selectedBrandData.totalCost)}
                    </span>
                  </div>
                </div>
              )}

              {/* All Brands Comparison */}
              <div className="mt-6">
                <h4 className="font-semibold text-sm mb-3">Brand Comparison</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {brandCalculations.map(({ brand, totalCost }) => (
                    <div key={brand.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{brand.name}</span>
                        <span className="font-bold text-primary">{formatPrice(totalCost)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}