import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { pricingService } from '@/services/pricingService';

interface PriceCalculationBreakdownProps {
  cabinetType: any;
  doorStyle: any;
  color: any;
  priceRanges: any[];
}

export function PriceCalculationBreakdown({ cabinetType, doorStyle, color, priceRanges }: PriceCalculationBreakdownProps) {
  if (!cabinetType || !doorStyle || !color || !priceRanges?.length) return null;

  const range = priceRanges[0]; // Use first range
  const width = range?.min_width_mm || 300;
  const height = cabinetType.default_height_mm || 720;
  const depth = cabinetType.default_depth_mm || 560;

  // Manual calculation to show breakdown
  const hmrRate = 2500; // Assuming default HMR rate
  const gstRate = 0.1; // 10% GST
  const doorQty = 1; // Custom qty as requested

  // Areas in square meters
  const backsArea = (width * height / 1000000) * 1;
  const bottomsArea = (width * depth / 1000000) * 1; 
  const sidesArea = (height * depth / 1000000) * 2;
  const doorArea = (width * height / 1000000) * doorQty;

  // Costs
  const backsCost = backsArea * hmrRate;
  const bottomsCost = bottomsArea * hmrRate;
  const sidesCost = sidesArea * hmrRate;
  const carcassTotal = backsCost + bottomsCost + sidesCost;

  const doorStyleRate = doorStyle?.base_rate_per_sqm || 0;
  const colorSurcharge = color?.surcharge_rate_per_sqm || 0;
  const doorRate = doorStyleRate + colorSurcharge;
  const doorCost = doorArea * doorRate;

  const subtotal = carcassTotal + doorCost;
  const gst = subtotal * gstRate;
  const total = subtotal + gst;

  return (
    <Card className="mt-4 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-orange-800">
          Price Calculation Breakdown - {cabinetType?.name || 'Cabinet'} ({doorStyle?.name || 'Style'} - {color?.name || 'Color'})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <h4 className="font-semibold text-orange-700 mb-2">Dimensions:</h4>
          <p>Width: {width}mm, Height: {height}mm, Depth: {depth}mm</p>
          <p>Door Quantity: {doorQty} (custom qty=1)</p>
        </div>

        <div>
          <h4 className="font-semibold text-orange-700 mb-2">Carcass Calculation (HMR @ ${hmrRate}/sqm):</h4>
          <p>• Backs: {backsArea.toFixed(4)} sqm × ${hmrRate} = ${backsCost.toFixed(2)}</p>
          <p>• Bottoms: {bottomsArea.toFixed(4)} sqm × ${hmrRate} = ${bottomsCost.toFixed(2)}</p>
          <p>• Sides: {sidesArea.toFixed(4)} sqm × ${hmrRate} = ${sidesCost.toFixed(2)}</p>
          <p className="font-medium">Carcass Total: ${carcassTotal.toFixed(2)}</p>
        </div>

        <div>
          <h4 className="font-semibold text-orange-700 mb-2">Door Calculation:</h4>
          <p>• Door Area: {doorArea.toFixed(4)} sqm</p>
          <p>• Door Style Rate: ${doorStyleRate}/sqm</p>
          <p>• Color Surcharge: ${colorSurcharge}/sqm</p>
          <p>• Total Rate: ${doorRate}/sqm</p>
          <p className="font-medium">Door Cost: {doorArea.toFixed(4)} × ${doorRate} = ${doorCost.toFixed(2)}</p>
        </div>

        <div>
          <h4 className="font-semibold text-orange-700 mb-2">Final Calculation:</h4>
          <p>• Subtotal: ${carcassTotal.toFixed(2)} + ${doorCost.toFixed(2)} = ${subtotal.toFixed(2)}</p>
          <p>• GST (10%): ${gst.toFixed(2)}</p>
          <p className="font-bold text-lg">Total: ${Math.round(total)}</p>
        </div>
      </CardContent>
    </Card>
  );
}