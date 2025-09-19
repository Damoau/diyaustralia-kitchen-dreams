import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, Settings, Eye, RefreshCw } from 'lucide-react';

interface PricingBreakdown {
  basePrice: number;
  doorStyleRate: number;
  colorSurcharge: number;
  hardwareCost: number;
  laborCost: number;
  surfaceArea: number;
  dimensionMultiplier: number;
  totalUnit: number;
  totalWithQuantity: number;
}

export const PriceCalculationEngine = () => {
  const [dimensions, setDimensions] = useState({
    width: 600,
    height: 720,
    depth: 560
  });
  
  const [pricing, setPricing] = useState({
    basePrice: 450,
    doorStyleRate: 2000, // per m²
    colorSurcharge: 150, // per m²
    hardwareCost: 85,
    laborRate: 120, // per hour
    laborHours: 0.5
  });
  
  const [quantity, setQuantity] = useState(1);
  const [breakdown, setBreakdown] = useState<PricingBreakdown | null>(null);

  const calculatePrice = () => {
    // Calculate surface area (front face)
    const widthM = dimensions.width / 1000;
    const heightM = dimensions.height / 1000;
    const surfaceArea = widthM * heightM;
    
    // Calculate dimension multiplier for non-standard sizes
    const standardWidth = 0.6; // 600mm
    const standardHeight = 0.72; // 720mm
    const dimensionMultiplier = Math.max(1, (widthM / standardWidth) * (heightM / standardHeight));
    
    // Calculate components
    const doorStyleCost = pricing.doorStyleRate * surfaceArea;
    const colorCost = pricing.colorSurcharge * surfaceArea;
    const laborCost = pricing.laborRate * pricing.laborHours;
    
    // Calculate unit price
    const unitPrice = pricing.basePrice + doorStyleCost + colorCost + pricing.hardwareCost + laborCost;
    const adjustedUnitPrice = unitPrice * dimensionMultiplier;
    const totalPrice = adjustedUnitPrice * quantity;
    
    const result: PricingBreakdown = {
      basePrice: pricing.basePrice,
      doorStyleRate: doorStyleCost,
      colorSurcharge: colorCost,
      hardwareCost: pricing.hardwareCost,
      laborCost: laborCost,
      surfaceArea: surfaceArea,
      dimensionMultiplier: dimensionMultiplier,
      totalUnit: adjustedUnitPrice,
      totalWithQuantity: totalPrice
    };
    
    setBreakdown(result);
  };

  React.useEffect(() => {
    calculatePrice();
  }, [dimensions, pricing, quantity]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">Price Calculation Engine</h3>
          <p className="text-muted-foreground">
            Test and validate pricing calculations
          </p>
        </div>
        <Button onClick={calculatePrice} className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4" />
          <span>Recalculate</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Dimensions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="calc-width">Width (mm)</Label>
                  <Input
                    id="calc-width"
                    type="number"
                    value={dimensions.width}
                    onChange={(e) => setDimensions(prev => ({ 
                      ...prev, 
                      width: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="calc-height">Height (mm)</Label>
                  <Input
                    id="calc-height"
                    type="number"
                    value={dimensions.height}
                    onChange={(e) => setDimensions(prev => ({ 
                      ...prev, 
                      height: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="calc-depth">Depth (mm)</Label>
                  <Input
                    id="calc-depth"
                    type="number"
                    value={dimensions.depth}
                    onChange={(e) => setDimensions(prev => ({ 
                      ...prev, 
                      depth: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>
              </div>
              
              {breakdown && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="text-sm">
                    <strong>Surface Area:</strong> {breakdown.surfaceArea.toFixed(2)} m²
                  </div>
                  <div className="text-sm">
                    <strong>Size Multiplier:</strong> {breakdown.dimensionMultiplier.toFixed(2)}x
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing Components</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="base-price">Base Price ($)</Label>
                  <Input
                    id="base-price"
                    type="number"
                    value={pricing.basePrice}
                    onChange={(e) => setPricing(prev => ({ 
                      ...prev, 
                      basePrice: parseFloat(e.target.value) || 0 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="hardware-cost">Hardware Cost ($)</Label>
                  <Input
                    id="hardware-cost"
                    type="number"
                    value={pricing.hardwareCost}
                    onChange={(e) => setPricing(prev => ({ 
                      ...prev, 
                      hardwareCost: parseFloat(e.target.value) || 0 
                    }))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="door-rate">Door Style Rate ($/m²)</Label>
                  <Input
                    id="door-rate"
                    type="number"
                    value={pricing.doorStyleRate}
                    onChange={(e) => setPricing(prev => ({ 
                      ...prev, 
                      doorStyleRate: parseFloat(e.target.value) || 0 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="color-surcharge">Color Surcharge ($/m²)</Label>
                  <Input
                    id="color-surcharge"
                    type="number"
                    value={pricing.colorSurcharge}
                    onChange={(e) => setPricing(prev => ({ 
                      ...prev, 
                      colorSurcharge: parseFloat(e.target.value) || 0 
                    }))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="labor-rate">Labor Rate ($/hour)</Label>
                  <Input
                    id="labor-rate"
                    type="number"
                    value={pricing.laborRate}
                    onChange={(e) => setPricing(prev => ({ 
                      ...prev, 
                      laborRate: parseFloat(e.target.value) || 0 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="labor-hours">Labor Hours</Label>
                  <Input
                    id="labor-hours"
                    type="number"
                    step="0.1"
                    value={pricing.laborHours}
                    onChange={(e) => setPricing(prev => ({ 
                      ...prev, 
                      laborHours: parseFloat(e.target.value) || 0 
                    }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          {breakdown && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Total Price</span>
                    <Badge>Live Calculation</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {formatPrice(breakdown.totalWithQuantity)}
                  </div>
                  {quantity > 1 && (
                    <div className="text-sm text-muted-foreground">
                      {formatPrice(breakdown.totalUnit)} per unit × {quantity}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calculator className="h-5 w-5" />
                    <span>Price Breakdown</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Base Price:</span>
                    <span>{formatPrice(breakdown.basePrice)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Door Style ({breakdown.surfaceArea.toFixed(2)}m² × {formatPrice(pricing.doorStyleRate)}/m²):</span>
                    <span>{formatPrice(breakdown.doorStyleRate)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Color Surcharge ({breakdown.surfaceArea.toFixed(2)}m² × {formatPrice(pricing.colorSurcharge)}/m²):</span>
                    <span>{formatPrice(breakdown.colorSurcharge)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Hardware Cost:</span>
                    <span>{formatPrice(breakdown.hardwareCost)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Labor ({pricing.laborHours}h × {formatPrice(pricing.laborRate)}/h):</span>
                    <span>{formatPrice(breakdown.laborCost)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatPrice(breakdown.totalUnit / breakdown.dimensionMultiplier)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Size Adjustment ({breakdown.dimensionMultiplier.toFixed(2)}x):</span>
                    <span>{formatPrice(breakdown.totalUnit - (breakdown.totalUnit / breakdown.dimensionMultiplier))}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-semibold">
                    <span>Unit Total:</span>
                    <span>{formatPrice(breakdown.totalUnit)}</span>
                  </div>
                  
                  {quantity > 1 && (
                    <div className="flex justify-between font-semibold text-primary">
                      <span>Total ({quantity} units):</span>
                      <span>{formatPrice(breakdown.totalWithQuantity)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Eye className="h-5 w-5" />
                    <span>Calculation Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm font-mono bg-muted p-3 rounded">
                    <div>Base: {formatPrice(breakdown.basePrice)}</div>
                    <div>+ Door: {formatPrice(breakdown.doorStyleRate)}</div>
                    <div>+ Color: {formatPrice(breakdown.colorSurcharge)}</div>
                    <div>+ Hardware: {formatPrice(breakdown.hardwareCost)}</div>
                    <div>+ Labor: {formatPrice(breakdown.laborCost)}</div>
                    <div>× Size: {breakdown.dimensionMultiplier.toFixed(2)}</div>
                    <div>× Qty: {quantity}</div>
                    <div className="border-t pt-1 mt-1 font-bold">
                      = {formatPrice(breakdown.totalWithQuantity)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};