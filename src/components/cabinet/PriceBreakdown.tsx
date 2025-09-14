import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CabinetType, CabinetPart, GlobalSettings, DoorStyleFinish, Color } from '@/types/cabinet';
import { parseGlobalSettings, formatPrice } from '@/lib/pricing';

interface PriceBreakdownProps {
  cabinetType: CabinetType;
  width: number;
  height: number;
  depth: number;
  doorStyleFinish: DoorStyleFinish;
  color?: Color;
  cabinetParts: CabinetPart[];
  globalSettings: GlobalSettings[];
  hardwareCost: number;
  totalPrice: number;
}

export function PriceBreakdown({
  cabinetType,
  width,
  height,
  depth,
  doorStyleFinish,
  color,
  cabinetParts,
  globalSettings,
  hardwareCost,
  totalPrice
}: PriceBreakdownProps) {
  const settings = parseGlobalSettings(globalSettings);

  // Get part quantities - use cabinet_type values for doors to match admin settings
  let qtyBacks = cabinetType.backs_qty || 1;
  let qtyBottoms = cabinetType.bottoms_qty || 1; 
  let qtySides = cabinetType.sides_qty || 2;
  let qtyDoors = cabinetType.door_qty || cabinetType.door_count || 0; // Use door_qty from admin
  
  // For non-door parts, use cabinet_parts data if available for accurate quantities
  if (cabinetParts.length > 0) {
    const backParts = cabinetParts.filter(p => p.part_name.toLowerCase().includes('back') && !p.is_door);
    const bottomParts = cabinetParts.filter(p => p.part_name.toLowerCase().includes('bottom') && !p.is_door);  
    const sideParts = cabinetParts.filter(p => p.part_name.toLowerCase().includes('side') && !p.is_door);
    
    // Only override carcass quantities, not door quantities
    qtyBacks = backParts.reduce((sum, part) => sum + part.quantity, 0) || qtyBacks;
    qtyBottoms = bottomParts.reduce((sum, part) => sum + part.quantity, 0) || qtyBottoms;
    qtySides = sideParts.reduce((sum, part) => sum + part.quantity, 0) || qtySides;
    
    // Keep door quantity from cabinet_type (admin setting) - don't override from parts
    console.log('Door quantity from admin:', qtyDoors);
  }
  
  // Convert dimensions to meters
  const widthM = width / 1000;
  const heightM = height / 1000;
  const depthM = depth / 1000;
  
  // Calculate individual costs
  const backCost = (widthM * heightM) * qtyBacks * settings.hmrRate;
  const bottomCost = (widthM * depthM) * qtyBottoms * settings.hmrRate;
  const sideCost = (widthM * depthM) * qtySides * settings.hmrRate;
  
  // Door cost breakdown
  const doorStyleBaseRate = doorStyleFinish?.door_style?.base_rate_per_sqm || 0;
  const doorStyleFinishRate = doorStyleFinish?.rate_per_sqm || 0;
  const colorSurcharge = color?.surcharge_rate_per_sqm || 0;
  const totalDoorRate = doorStyleBaseRate + doorStyleFinishRate + colorSurcharge;
  const doorCost = (widthM * heightM) * qtyDoors * totalDoorRate;
  
  // Totals (no wastage applied)
  const subtotal = backCost + bottomCost + sideCost + doorCost + hardwareCost;
  const gstAmount = subtotal * settings.gstRate;
  const finalTotal = subtotal + gstAmount;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Price Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dimensions */}
        <div>
          <h4 className="font-semibold mb-2">Cabinet Dimensions</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>Width: {width}mm ({widthM.toFixed(3)}m)</div>
            <div>Height: {height}mm ({heightM.toFixed(3)}m)</div>
            <div>Depth: {depth}mm ({depthM.toFixed(3)}m)</div>
          </div>
        </div>

        <Separator />

        {/* Material Costs */}
        <div>
          <h4 className="font-semibold mb-2">Carcass Material Costs</h4>
          <div className="space-y-2 text-sm">
            {/* Back panels */}
            <div className="flex justify-between items-center">
              <span>Back panels ({qtyBacks}x):</span>
              <span className="font-mono text-xs">
                {widthM.toFixed(3)} × {heightM.toFixed(3)} × {qtyBacks} × ${settings.hmrRate} = {formatPrice(backCost)}
              </span>
            </div>
            
            {/* Bottom panels */}
            <div className="flex justify-between items-center">
              <span>Bottom panels ({qtyBottoms}x):</span>
              <span className="font-mono text-xs">
                {widthM.toFixed(3)} × {depthM.toFixed(3)} × {qtyBottoms} × ${settings.hmrRate} = {formatPrice(bottomCost)}
              </span>
            </div>
            
            {/* Side panels */}
            <div className="flex justify-between items-center">
              <span>Side panels ({qtySides}x):</span>
              <span className="font-mono text-xs">
                {widthM.toFixed(3)} × {depthM.toFixed(3)} × {qtySides} × ${settings.hmrRate} = {formatPrice(sideCost)}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Door Costs */}
        {qtyDoors > 0 && (
          <>
            <div>
              <h4 className="font-semibold mb-2">Door/Drawer Costs ({qtyDoors}x)</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span>Total Door Rate (incl. finish):</span>
                  <span>${totalDoorRate.toFixed(2)}/m²</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center font-semibold">
                  <span>Door Cost Formula:</span>
                  <span className="font-mono text-xs">
                    ({widthM.toFixed(3)} × {heightM.toFixed(3)}) × {qtyDoors} × ${totalDoorRate.toFixed(2)} = {formatPrice(doorCost)}
                  </span>
                </div>
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Hardware */}
        {hardwareCost > 0 && (
          <>
            <div className="flex justify-between items-center">
              <span className="font-semibold">Hardware Cost:</span>
              <span>{formatPrice(hardwareCost)}</span>
            </div>
            <Separator />
          </>
        )}

        {/* Subtotal and adjustments */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span>Subtotal:</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>GST ({(settings.gstRate * 100).toFixed(1)}%):</span>
            <span>{formatPrice(gstAmount)}</span>
          </div>
        </div>

        <Separator />

        {/* Final Total */}
        <div className="flex justify-between items-center text-lg font-bold">
          <span>Total Price:</span>
          <span className="text-primary">{formatPrice(finalTotal)}</span>
        </div>
      </CardContent>
    </Card>
  );
}