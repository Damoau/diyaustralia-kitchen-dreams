import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface PriceCalculationBreakdownProps {
  cabinetType: any;
  doorStyle: any;
  color: any;
  priceRanges: any[];
}

interface GlobalSettings {
  hmr_rate_per_sqm: number;
  gst_rate: number;
}

export function PriceCalculationBreakdown({ cabinetType, doorStyle, color, priceRanges }: PriceCalculationBreakdownProps) {
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  
  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('global_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['hmr_rate_per_sqm', 'gst_rate']);
      
      if (data) {
        const settingsMap = data.reduce((acc, item) => {
          acc[item.setting_key] = parseFloat(item.setting_value);
          return acc;
        }, {} as Record<string, number>);
        
        setSettings({
          hmr_rate_per_sqm: settingsMap.hmr_rate_per_sqm || 1000,
          gst_rate: settingsMap.gst_rate || 0.1
        });
      }
    };
    
    fetchSettings();
  }, []);

  if (!cabinetType || !doorStyle || !color || !priceRanges?.length || !settings) return null;

  const range = priceRanges[0]; // Use first range
  const width = 600; // Fixed width as per user formula (600mm)
  const height = cabinetType.default_height_mm || 720;
  const depth = cabinetType.default_depth_mm || 560;
  const doorQty = 1; // Custom qty as requested

  // Areas in square meters
  const backsArea = (width * height / 1000000) * 1;
  const bottomsArea = (width * depth / 1000000) * 1; 
  const sidesArea = (height * depth / 1000000) * 2;
  const doorArea = (width * height / 1000000) * doorQty;

  // Costs using actual database values
  const hmrRate = settings.hmr_rate_per_sqm;
  const backsCost = backsArea * hmrRate;
  const bottomsCost = bottomsArea * hmrRate;
  const sidesCost = sidesArea * hmrRate;
  const carcassTotal = backsCost + bottomsCost + sidesCost;

  const doorStyleRate = doorStyle?.base_rate_per_sqm || 0;
  const colorSurcharge = color?.surcharge_rate_per_sqm || 0;
  const doorRate = doorStyleRate + colorSurcharge;
  const doorCost = doorArea * doorRate;

  const hardwareCost = 10; // As per your formula
  const subtotal = carcassTotal + doorCost + hardwareCost;
  const gst = subtotal * settings.gst_rate;
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
          <h4 className="font-semibold text-orange-700 mb-2">Cabinet Dimensions:</h4>
          <p>Width: {width}mm ({(width/1000).toFixed(3)}m)</p>
          <p>Height: {height}mm ({(height/1000).toFixed(3)}m)</p>
          <p>Depth: {depth}mm ({(depth/1000).toFixed(3)}m)</p>
          <p>Door Quantity: {doorQty} (custom qty=1)</p>
        </div>

        <div>
          <h4 className="font-semibold text-orange-700 mb-2">Carcass Material Costs:</h4>
          <p><strong>Back panels (1x):</strong></p>
          <p>{(width/1000).toFixed(3)} × {(height/1000).toFixed(3)} × 1 × ${hmrRate} = ${backsCost.toFixed(0)}</p>
          
          <p className="mt-2"><strong>Bottom panels (1x):</strong></p>
          <p>{(width/1000).toFixed(3)} × {(depth/1000).toFixed(3)} × 1 × ${hmrRate} = ${bottomsCost.toFixed(0)}</p>
          
          <p className="mt-2"><strong>Side panels (2x):</strong></p>
          <p>{(height/1000).toFixed(3)} × {(depth/1000).toFixed(3)} × 2 × ${hmrRate} = ${sidesCost.toFixed(0)}</p>
        </div>

        <div>
          <h4 className="font-semibold text-orange-700 mb-2">Door/Drawer Costs ({doorQty}x):</h4>
          <p><strong>Total Door Rate (incl. finish):</strong> ${doorRate.toFixed(2)}/m²</p>
          <p><strong>Door Cost Formula:</strong></p>
          <p>({(width/1000).toFixed(3)} × {(height/1000).toFixed(3)}) × {doorQty} × ${doorRate.toFixed(2)} = ${doorCost.toFixed(0)}</p>
        </div>

        <div>
          <h4 className="font-semibold text-orange-700 mb-2">Hardware Cost:</h4>
          <p>${hardwareCost}</p>
        </div>

        <div>
          <h4 className="font-semibold text-orange-700 mb-2">Final Calculation:</h4>
          <p><strong>Subtotal:</strong> ${Math.round(carcassTotal)} + ${Math.round(doorCost)} + ${hardwareCost} = ${Math.round(subtotal)}</p>
          <p><strong>GST ({(settings.gst_rate * 100).toFixed(1)}%):</strong> ${Math.round(gst)}</p>
          <p className="font-bold text-lg"><strong>Total Price:</strong> ${Math.round(total)}</p>
        </div>
      </CardContent>
    </Card>
  );
}