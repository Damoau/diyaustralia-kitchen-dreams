import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Truck, Package, MapPin, Weight } from 'lucide-react';
import { usePostcodeServices } from '@/hooks/usePostcodeServices';
import { useWeightCalculation } from '@/hooks/useWeightCalculation';

interface ShippingItem {
  id: string;
  cabinetTypeId: string;
  width_mm: number;
  height_mm: number;
  depth_mm: number;
  doorStyleId?: string;
  quantity: number;
  name: string;
}

interface EnhancedShippingCalculatorProps {
  items: ShippingItem[];
  onShippingCalculated?: (shippingCost: number, method: string) => void;
  className?: string;
}

export const EnhancedShippingCalculator: React.FC<EnhancedShippingCalculatorProps> = ({
  items,
  onShippingCalculated,
  className = '',
}) => {
  const [fromPostcode, setFromPostcode] = useState('2000'); // Default warehouse
  const [toPostcode, setToPostcode] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'depot' | 'home' | null>(null);
  const [shippingQuote, setShippingQuote] = useState<any>(null);
  const [totalWeight, setTotalWeight] = useState(0);
  const [totalPackages, setTotalPackages] = useState<any[]>([]);

  const { checkPostcodeServices, getShippingQuote, loading: servicesLoading } = usePostcodeServices();
  const { calculateWeight, loading: weightLoading } = useWeightCalculation();

  // Calculate total weight and packages for all items
  useEffect(() => {
    const calculateAllWeights = async () => {
      if (!items.length) return;

      let combinedWeight = 0;
      const packages = [];

      for (const item of items) {
        const weightResult = await calculateWeight({
          cabinetTypeId: item.cabinetTypeId,
          width_mm: item.width_mm,
          height_mm: item.height_mm,
          depth_mm: item.depth_mm,
          doorStyleId: item.doorStyleId,
          quantity: item.quantity,
        });

        if (weightResult) {
          combinedWeight += weightResult.totalWeight;
          
          // Create package entry for each item
          packages.push({
            weight_kg: weightResult.totalWeight,
            cubic_m: weightResult.packageDimensions.cubic_m,
            length_mm: weightResult.packageDimensions.length_mm,
            width_mm: weightResult.packageDimensions.width_mm,
            height_mm: weightResult.packageDimensions.height_mm,
            item_name: item.name,
            quantity: item.quantity,
          });
        }
      }

      setTotalWeight(combinedWeight);
      setTotalPackages(packages);
    };

    calculateAllWeights();
  }, [items, calculateWeight]);

  const handleCalculateShipping = async () => {
    if (!toPostcode || totalPackages.length === 0) return;

    // Check destination services
    const services = await checkPostcodeServices(toPostcode);
    if (!services) return;

    // Get shipping quote
    const quote = await getShippingQuote(
      fromPostcode,
      toPostcode,
      totalPackages,
      {
        residential: selectedMethod === 'home',
        tailLift: totalWeight > 100, // Auto tail lift for heavy items
        twoMan: totalWeight > 150, // Auto two-man delivery for very heavy items
      }
    );

    if (quote && typeof quote === 'object' && 'total_inc_gst' in quote) {
      setShippingQuote(quote);
      
      // Add assembly cost if selected and available
      let finalCost = Number(quote.total_inc_gst || 0);
      if (selectedMethod === 'home' && services.services.assembly) {
        const assemblyCost = services.pricing.assemblyPerCabinet * items.reduce((sum, item) => sum + item.quantity, 0);
        finalCost += assemblyCost;
      }

      onShippingCalculated?.(finalCost, selectedMethod || 'depot');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(price);
  };

  const isLoading = servicesLoading || weightLoading;

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Weight Summary */}
          <div className="flex items-center gap-4 p-3 bg-muted rounded-md">
            <Weight className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Total Weight: {totalWeight.toFixed(1)} kg</p>
              <p className="text-sm text-muted-foreground">
                {totalPackages.length} package{totalPackages.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Postcode Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Delivery Postcode</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter delivery postcode"
                value={toPostcode}
                onChange={(e) => setToPostcode(e.target.value)}
                maxLength={4}
                className="flex-1"
              />
              <Button
                onClick={handleCalculateShipping}
                disabled={isLoading || !toPostcode || totalPackages.length === 0}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Calculate'}
              </Button>
            </div>
          </div>

          {/* Delivery Method Selection */}
          {toPostcode && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Delivery Method</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={selectedMethod === 'depot' ? 'default' : 'outline'}
                  onClick={() => setSelectedMethod('depot')}
                  className="h-auto p-3 flex flex-col items-start"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="h-4 w-4" />
                    <span className="font-medium">Depot Pickup</span>
                  </div>
                  <span className="text-xs">Collect from local depot</span>
                </Button>
                <Button
                  variant={selectedMethod === 'home' ? 'default' : 'outline'}
                  onClick={() => setSelectedMethod('home')}
                  className="h-auto p-3 flex flex-col items-start"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Truck className="h-4 w-4" />
                    <span className="font-medium">Home Delivery</span>
                  </div>
                  <span className="text-xs">Direct to your door</span>
                </Button>
              </div>
            </div>
          )}

          {/* Shipping Quote Results */}
          {shippingQuote && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Shipping Quote</span>
                  <Badge variant="default">{shippingQuote.carrier}</Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Service:</span>
                    <span>{shippingQuote.service_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weight:</span>
                    <span>{Number(shippingQuote.total_weight_kg || 0)} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Volume:</span>
                    <span>{Number(shippingQuote.total_cubic_m || 0)} m³</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span>Subtotal (ex GST):</span>
                    <span>{formatPrice(Number(shippingQuote.total_ex_gst || 0))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST:</span>
                    <span>{formatPrice(Number(shippingQuote.gst || 0))}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Total (inc GST):</span>
                    <span>{formatPrice(Number(shippingQuote.total_inc_gst || 0))}</span>
                  </div>
                </div>

                {selectedMethod === 'home' && totalWeight > 100 && (
                  <div className="p-2 text-xs bg-blue-50 text-blue-700 rounded">
                    ℹ️ Tail lift delivery included due to weight
                  </div>
                )}

                {selectedMethod === 'home' && totalWeight > 150 && (
                  <div className="p-2 text-xs bg-orange-50 text-orange-700 rounded">
                    ⚠️ Two-man delivery required due to weight
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Package Details */}
          {totalPackages.length > 0 && (
            <details className="space-y-2">
              <summary className="text-sm font-medium cursor-pointer">
                Package Details ({totalPackages.length} items)
              </summary>
              <div className="space-y-2 pl-4">
                {totalPackages.map((pkg, index) => (
                  <div key={index} className="text-xs p-2 bg-muted rounded text-muted-foreground">
                    <div className="font-medium">{pkg.item_name} (x{pkg.quantity})</div>
                    <div>
                      {pkg.weight_kg.toFixed(1)}kg • {pkg.cubic_m.toFixed(3)}m³ • 
                      {pkg.length_mm}×{pkg.width_mm}×{pkg.height_mm}mm
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
};