import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/pricing";

export const PolyPricingBreakdown = () => {
  // Data from your database for "Poly 750-799" calculation
  const cabinetData = {
    name: "4 door base",
    width: 750, // Using min width from 750-799 range
    height: 720, // Default height
    depth: 560, // Default depth
    backs_qty: 1,
    bottoms_qty: 1, 
    sides_qty: 2,
    door_qty: 1  // Actual value from database, not 4!
  };

  const pricingData = {
    hmrRate: 1000, // From global settings
    doorStyleRate: 0, // "poly" door style base rate
    doorFinishRate: 0, // No finish configured
    defaultColorSurcharge: 1000, // "Black" color (first in list)
    carcassMaterialRate: 200, // 20% of HMR rate (1000 * 0.2)
    hardwareBaseCost: 45,
    wastageFactor: 0.05,
    gstRate: 0.10
  };

  // Convert to meters
  const widthM = cabinetData.width / 1000;
  const heightM = cabinetData.height / 1000;
  const depthM = cabinetData.depth / 1000;

  // Calculate each component
  const backCost = (widthM * heightM) * cabinetData.backs_qty * pricingData.hmrRate;
  const bottomCost = (widthM * depthM) * cabinetData.bottoms_qty * pricingData.hmrRate;
  const sideCost = (depthM * heightM) * cabinetData.sides_qty * pricingData.hmrRate;
  
  const totalDoorRate = pricingData.doorStyleRate + pricingData.doorFinishRate + pricingData.defaultColorSurcharge;
  const doorCost = (widthM * heightM) * cabinetData.door_qty * totalDoorRate;
  
  const hardwareCost = pricingData.hardwareBaseCost;
  
  const subtotal = backCost + bottomCost + sideCost + doorCost + hardwareCost;
  const subtotalWithWastage = subtotal * (1 + pricingData.wastageFactor);
  const totalCost = subtotalWithWastage * (1 + pricingData.gstRate);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detailed Pricing Breakdown: Poly 750-799mm</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 text-sm">
          {/* Cabinet Specifications */}
          <div className="bg-muted p-3 rounded">
            <div className="font-semibold mb-2">Cabinet Specifications:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Type: {cabinetData.name}</div>
              <div>Width Range: 750-799mm (using {cabinetData.width}mm)</div>
              <div>Height: {cabinetData.height}mm</div>
              <div>Depth: {cabinetData.depth}mm</div>
              <div>Backs: {cabinetData.backs_qty}</div>
              <div>Bottoms: {cabinetData.bottoms_qty}</div>
              <div>Sides: {cabinetData.sides_qty}</div>
              <div>Doors: {cabinetData.door_qty} (Database value - not based on name)</div>
            </div>
          </div>

          {/* Pricing Components */}
          <div className="bg-muted p-3 rounded">
            <div className="font-semibold mb-2">Pricing Components:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>HMR Rate: ${pricingData.hmrRate}/m²</div>
              <div>Door Style (Poly): ${pricingData.doorStyleRate}/m²</div>
              <div>Door Finish: ${pricingData.doorFinishRate}/m²</div>
              <div>Color (Black - Default): ${pricingData.defaultColorSurcharge}/m²</div>
              <div>Carcass Material: ${pricingData.carcassMaterialRate}/m²</div>
              <div>Hardware: ${pricingData.hardwareBaseCost}</div>
              <div>Wastage: {(pricingData.wastageFactor * 100).toFixed(1)}%</div>
              <div>GST: {(pricingData.gstRate * 100).toFixed(1)}%</div>
            </div>
          </div>

          {/* Detailed Calculations */}
          <div className="space-y-3">
            <div className="font-semibold">Step-by-Step Calculation:</div>
            
            <div className="bg-blue-50 p-2 rounded text-xs">
              <div className="font-medium">1. Back Cost:</div>
              <div>({widthM.toFixed(3)}m × {heightM.toFixed(3)}m) × {cabinetData.backs_qty} × ${pricingData.hmrRate}</div>
              <div>= {(widthM * heightM).toFixed(6)} × {cabinetData.backs_qty} × ${pricingData.hmrRate}</div>
              <div className="font-semibold text-primary">= {formatPrice(backCost)}</div>
            </div>

            <div className="bg-green-50 p-2 rounded text-xs">
              <div className="font-medium">2. Bottom Cost:</div>
              <div>({widthM.toFixed(3)}m × {depthM.toFixed(3)}m) × {cabinetData.bottoms_qty} × ${pricingData.hmrRate}</div>
              <div>= {(widthM * depthM).toFixed(6)} × {cabinetData.bottoms_qty} × ${pricingData.hmrRate}</div>
              <div className="font-semibold text-primary">= {formatPrice(bottomCost)}</div>
            </div>

            <div className="bg-yellow-50 p-2 rounded text-xs">
              <div className="font-medium">3. Side Cost:</div>
              <div>({depthM.toFixed(3)}m × {heightM.toFixed(3)}m) × {cabinetData.sides_qty} × ${pricingData.hmrRate}</div>
              <div>= {(depthM * heightM).toFixed(6)} × {cabinetData.sides_qty} × ${pricingData.hmrRate}</div>
              <div className="font-semibold text-primary">= {formatPrice(sideCost)}</div>
            </div>

            <div className="bg-purple-50 p-2 rounded text-xs">
              <div className="font-medium">4. Door Cost (4 Components):</div>
              <div className="ml-2 space-y-1">
                <div>• Door Style (Poly): ${pricingData.doorStyleRate}/m²</div>
                <div>• Door Finish: ${pricingData.doorFinishRate}/m²</div>
                <div>• Color (Black - First/Default): ${pricingData.defaultColorSurcharge}/m²</div>
                <div><strong>Total Door Rate: ${totalDoorRate}/m²</strong></div>
              </div>
              <div>({widthM.toFixed(3)}m × {heightM.toFixed(3)}m) × {cabinetData.door_qty} × ${totalDoorRate}</div>
              <div>= {(widthM * heightM).toFixed(6)} × {cabinetData.door_qty} × ${totalDoorRate}</div>
              <div className="font-semibold text-primary">= {formatPrice(doorCost)}</div>
            </div>

            <div className="bg-gray-50 p-2 rounded text-xs">
              <div className="font-medium">5. Hardware Cost:</div>
              <div className="font-semibold text-primary">= {formatPrice(hardwareCost)}</div>
            </div>
          </div>

          {/* Final Summary */}
          <div className="bg-muted p-3 rounded border-2 border-primary">
            <div className="font-semibold text-lg mb-2">Final Calculation:</div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Back Cost:</span>
                <span>{formatPrice(backCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Bottom Cost:</span>
                <span>{formatPrice(bottomCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Side Cost:</span>
                <span>{formatPrice(sideCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Door Cost:</span>
                <span>{formatPrice(doorCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Hardware Cost:</span>
                <span>{formatPrice(hardwareCost)}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-medium">
                <span>Subtotal:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>+ Wastage ({(pricingData.wastageFactor * 100).toFixed(1)}%):</span>
                <span>{formatPrice(subtotalWithWastage - subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>+ GST ({(pricingData.gstRate * 100).toFixed(1)}%):</span>
                <span>{formatPrice(totalCost - subtotalWithWastage)}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between text-xl font-bold text-primary">
                <span>TOTAL:</span>
                <span>{formatPrice(totalCost)}</span>
              </div>
            </div>
          </div>

          {/* Default Color Rule */}
          <div className="bg-blue-50 p-3 rounded border border-blue-200">
            <div className="font-semibold text-blue-800 mb-2">Default Color Rule Applied:</div>
            <div className="text-sm text-blue-700">
              ✅ The first color in the Door Style &gt; Color list is automatically used as default.<br />
              📝 For "Poly", the first color is "Black" (${pricingData.defaultColorSurcharge}/m² surcharge)<br />
              🔧 Colors are now sorted by sort_order, then by name
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PolyPricingBreakdown;