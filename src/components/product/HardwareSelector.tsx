import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useHardwarePricing } from '@/hooks/useHardwarePricing';

interface HardwareSelectorProps {
  cabinetType: any;
  selectedHardware: { [category: string]: string };
  onHardwareChange: (category: string, setId: string) => void;
  quantity: number;
}

export const HardwareSelector: React.FC<HardwareSelectorProps> = ({
  cabinetType,
  selectedHardware,
  onHardwareChange,
  quantity = 1
}) => {
  const { 
    getHardwareOptions,
    calculateCabinetHardwareCost
  } = useHardwarePricing();

  // Loading state is handled internally by the hook
  const hingeOptions = getHardwareOptions('hinge');
  const runnerOptions = getHardwareOptions('runner');
  
  if (!hingeOptions || !runnerOptions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hardware Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const needsHinges = (cabinetType?.door_qty || cabinetType?.door_count || 0) > 0;
  const needsRunners = (cabinetType?.drawer_count || 0) > 0;

  const hardwareCosts = calculateCabinetHardwareCost(
    cabinetType, 
    selectedHardware, 
    quantity
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Hardware Selection
          {hardwareCosts.totalCost > 0 && (
            <Badge variant="outline" className="text-lg font-semibold">
              +${hardwareCosts.totalCost.toFixed(2)}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {needsHinges && (
          <div className="space-y-3">
            <Label htmlFor="hinge-selection" className="text-base font-medium">
              Door Hinges
            </Label>
            <Select
              value={selectedHardware.hinge || ''}
              onValueChange={(value) => onHardwareChange('hinge', value)}
            >
              <SelectTrigger id="hinge-selection">
                <SelectValue placeholder="Select hinge brand" />
              </SelectTrigger>
              <SelectContent>
                {hingeOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <span>{option.name}</span>
                        {option.isDefault && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground ml-2">
                        ${(option.pricing.baseCost * (cabinetType?.door_qty || cabinetType?.door_count || 1) * quantity).toFixed(2)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {hardwareCosts.breakdown.hinge && (
              <div className="text-sm space-y-1 p-3 bg-muted/30 rounded-md">
                <div className="flex justify-between">
                  <span>Brand:</span>
                  <span className="font-medium">{hardwareCosts.breakdown.hinge.brandName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Set:</span>
                  <span>{hardwareCosts.breakdown.hinge.setName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <span>{hardwareCosts.breakdown.hinge.quantity} sets</span>
                </div>
                <div className="flex justify-between">
                  <span>Cost (ex GST):</span>
                  <span className="font-semibold">${hardwareCosts.breakdown.hinge.finalCost.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {needsRunners && (
          <div className="space-y-3">
            <Label htmlFor="runner-selection" className="text-base font-medium">
              Drawer Runners
            </Label>
            <Select
              value={selectedHardware.runner || ''}
              onValueChange={(value) => onHardwareChange('runner', value)}
            >
              <SelectTrigger id="runner-selection">
                <SelectValue placeholder="Select runner brand" />
              </SelectTrigger>
              <SelectContent>
                {runnerOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <span>{option.name}</span>
                        {option.isDefault && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground ml-2">
                        ${(option.pricing.baseCost * (cabinetType?.drawer_count || 0) * quantity).toFixed(2)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {hardwareCosts.breakdown.runner && (
              <div className="text-sm space-y-1 p-3 bg-muted/30 rounded-md">
                <div className="flex justify-between">
                  <span>Brand:</span>
                  <span className="font-medium">{hardwareCosts.breakdown.runner.brandName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Set:</span>
                  <span>{hardwareCosts.breakdown.runner.setName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <span>{hardwareCosts.breakdown.runner.quantity} sets</span>
                </div>
                <div className="flex justify-between">
                  <span>Cost (ex GST):</span>
                  <span className="font-semibold">${hardwareCosts.breakdown.runner.finalCost.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {!needsHinges && !needsRunners && (
          <div className="text-center text-muted-foreground py-4">
            This cabinet type doesn't require hinges or drawer runners.
          </div>
        )}

        {hardwareCosts.totalCost > 0 && (
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total Hardware Cost:</span>
              <span>${hardwareCosts.totalCost.toFixed(2)} (ex GST)</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};