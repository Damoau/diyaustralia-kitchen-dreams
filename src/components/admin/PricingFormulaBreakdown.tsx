import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { CabinetType, GlobalSettings } from "@/types/cabinet";
import { parseGlobalSettings } from "@/lib/pricing";
import { formatPrice } from "@/lib/pricing";

interface PricingFormulaBreakdownProps {
  cabinetType?: CabinetType;
}

export const PricingFormulaBreakdown = ({ cabinetType }: PricingFormulaBreakdownProps) => {
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings[]>([]);
  const [testWidth, setTestWidth] = useState<number>(600);
  const [testHeight, setTestHeight] = useState<number>(720);
  const [testDepth, setTestDepth] = useState<number>(560);
  const [doorStyleRate, setDoorStyleRate] = useState<number>(120);
  const [finishRate, setFinishRate] = useState<number>(25);
  const [colorSurcharge, setColorSurcharge] = useState<number>(10);
  
  useEffect(() => {
    const fetchGlobalSettings = async () => {
      const { data, error } = await supabase.from('global_settings').select('*');
      if (error) {
        console.error('Error fetching global settings:', error);
        return;
      }
      setGlobalSettings(data || []);
    };

    fetchGlobalSettings();
  }, []);

  if (!cabinetType) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pricing Formula Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Select a cabinet type to see the pricing formula breakdown.</p>
        </CardContent>
      </Card>
    );
  }

  const settings = parseGlobalSettings(globalSettings);
  
  // Get part quantities
  const qtyBacks = cabinetType.backs_qty || 1;
  const qtyBottoms = cabinetType.bottoms_qty || 1; 
  const qtySides = cabinetType.sides_qty || 2;
  const qtyDoors = cabinetType.door_qty || 0;
  
  // Convert to meters
  const widthM = testWidth / 1000;
  const heightM = testHeight / 1000;
  const depthM = testDepth / 1000;
  
  // Calculate each component
  const backCost = (widthM * heightM) * qtyBacks * settings.hmrRate;
  const bottomCost = (widthM * depthM) * qtyBottoms * settings.hmrRate;
  const sideCost = (widthM * depthM) * qtySides * settings.hmrRate;
  const totalDoorRate = doorStyleRate + finishRate + colorSurcharge;
  const doorCost = (widthM * heightM) * qtyDoors * totalDoorRate;
  const hardwareCost = settings.hardwareBaseCost;
  
  const subtotal = backCost + bottomCost + sideCost + doorCost + hardwareCost;
  const subtotalWithWastage = subtotal * (1 + settings.wastageFactor);
  const totalCost = subtotalWithWastage * (1 + settings.gstRate);

  return (
    <div className="space-y-6">
      {/* Global Settings Display */}
      <Card>
        <CardHeader>
          <CardTitle>Global Settings (Current Values)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">HMR Rate per m²:</span> ${settings.hmrRate}
            </div>
            <div>
              <span className="font-medium">Hardware Base Cost:</span> ${settings.hardwareBaseCost}
            </div>
            <div>
              <span className="font-medium">Wastage Factor:</span> {(settings.wastageFactor * 100).toFixed(1)}%
            </div>
            <div>
              <span className="font-medium">GST Rate:</span> {(settings.gstRate * 100).toFixed(1)}%
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cabinet Type Info */}
      <Card>
        <CardHeader>
          <CardTitle>Cabinet Type: {cabinetType.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Back Parts Qty:</span> {qtyBacks}
            </div>
            <div>
              <span className="font-medium">Bottom Parts Qty:</span> {qtyBottoms}
            </div>
            <div>
              <span className="font-medium">Side Parts Qty:</span> {qtySides}
            </div>
            <div>
              <span className="font-medium">Door Parts Qty:</span> {qtyDoors}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Dimensions */}
      <Card>
        <CardHeader>
          <CardTitle>Test Calculation (Adjust Values)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="width">Width (mm)</Label>
              <Input
                id="width"
                type="number"
                value={testWidth}
                onChange={(e) => setTestWidth(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="height">Height (mm)</Label>
              <Input
                id="height"
                type="number"
                value={testHeight}
                onChange={(e) => setTestHeight(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="depth">Depth (mm)</Label>
              <Input
                id="depth"
                type="number"
                value={testDepth}
                onChange={(e) => setTestDepth(Number(e.target.value))}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="doorStyle">Door Style Rate ($/m²)</Label>
              <Input
                id="doorStyle"
                type="number"
                value={doorStyleRate}
                onChange={(e) => setDoorStyleRate(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="finish">Finish Rate ($/m²)</Label>
              <Input
                id="finish"
                type="number"
                value={finishRate}
                onChange={(e) => setFinishRate(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="color">Color Surcharge ($/m²)</Label>
              <Input
                id="color"
                type="number"
                value={colorSurcharge}
                onChange={(e) => setColorSurcharge(Number(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formula Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Formula Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm font-mono">
            <div className="bg-muted p-3 rounded">
              <div className="font-semibold mb-2">Dimensions in Meters:</div>
              <div>Width: {testWidth}mm ÷ 1000 = {widthM.toFixed(3)}m</div>
              <div>Height: {testHeight}mm ÷ 1000 = {heightM.toFixed(3)}m</div>
              <div>Depth: {testDepth}mm ÷ 1000 = {depthM.toFixed(3)}m</div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="font-semibold">1. Back Cost Calculation:</div>
              <div>Formula: (Width × Height) × Qty Backs × HMR Rate</div>
              <div>Calculation: ({widthM.toFixed(3)} × {heightM.toFixed(3)}) × {qtyBacks} × ${settings.hmrRate}</div>
              <div>= {(widthM * heightM).toFixed(6)} × {qtyBacks} × ${settings.hmrRate}</div>
              <div className="font-semibold text-primary">= {formatPrice(backCost)}</div>
            </div>

            <div className="space-y-2">
              <div className="font-semibold">2. Bottom Cost Calculation:</div>
              <div>Formula: (Width × Depth) × Qty Bottoms × HMR Rate</div>
              <div>Calculation: ({widthM.toFixed(3)} × {depthM.toFixed(3)}) × {qtyBottoms} × ${settings.hmrRate}</div>
              <div>= {(widthM * depthM).toFixed(6)} × {qtyBottoms} × ${settings.hmrRate}</div>
              <div className="font-semibold text-primary">= {formatPrice(bottomCost)}</div>
            </div>

            <div className="space-y-2">
              <div className="font-semibold">3. Side Cost Calculation:</div>
              <div>Formula: (Depth × Height) × Qty Sides × HMR Rate</div>
              <div>Calculation: ({depthM.toFixed(3)} × {heightM.toFixed(3)}) × {qtySides} × ${settings.hmrRate}</div>
              <div>= {(depthM * heightM).toFixed(6)} × {qtySides} × ${settings.hmrRate}</div>
              <div className="font-semibold text-primary">= {formatPrice(sideCost)}</div>
            </div>

            {qtyDoors > 0 && (
              <div className="space-y-2">
                <div className="font-semibold">4. Door Cost Calculation:</div>
                <div>Total Door Rate: ${doorStyleRate} + ${finishRate} + ${colorSurcharge} = ${totalDoorRate}/m²</div>
                <div>Formula: (Width × Height) × Qty Doors × Total Door Rate</div>
                <div>Calculation: ({widthM.toFixed(3)} × {heightM.toFixed(3)}) × {qtyDoors} × ${totalDoorRate}</div>
                <div>= {(widthM * heightM).toFixed(6)} × {qtyDoors} × ${totalDoorRate}</div>
                <div className="font-semibold text-primary">= {formatPrice(doorCost)}</div>
              </div>
            )}

            <div className="space-y-2">
              <div className="font-semibold">5. Hardware Cost:</div>
              <div className="font-semibold text-primary">= {formatPrice(hardwareCost)} (base cost)</div>
            </div>

            <Separator />

            <div className="space-y-2 bg-muted p-3 rounded">
              <div className="font-semibold">Cost Summary:</div>
              <div>Back Cost: {formatPrice(backCost)}</div>
              <div>Bottom Cost: {formatPrice(bottomCost)}</div>
              <div>Side Cost: {formatPrice(sideCost)}</div>
              {qtyDoors > 0 && <div>Door Cost: {formatPrice(doorCost)}</div>}
              <div>Hardware Cost: {formatPrice(hardwareCost)}</div>
              <Separator />
              <div className="font-semibold">Subtotal: {formatPrice(subtotal)}</div>
              <div>+ Wastage ({(settings.wastageFactor * 100).toFixed(1)}%): {formatPrice(subtotalWithWastage - subtotal)}</div>
              <div>= Subtotal with Wastage: {formatPrice(subtotalWithWastage)}</div>
              <div>+ GST ({(settings.gstRate * 100).toFixed(1)}%): {formatPrice(totalCost - subtotalWithWastage)}</div>
              <div className="text-lg font-bold text-primary">TOTAL: {formatPrice(totalCost)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PricingFormulaBreakdown;