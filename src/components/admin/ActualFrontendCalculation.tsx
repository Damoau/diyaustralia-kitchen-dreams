import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/pricing";

export const ActualFrontendCalculation = () => {
  // Actual "4 door base" data from database
  const cabinetData = {
    name: "4 door base",
    door_qty: 1,
    backs_qty: 1,
    bottoms_qty: 1,
    sides_qty: 2,
    default_height_mm: 720,
    default_depth_mm: 560
  };

  const settings = {
    hmrRate: 1000,
    hardwareBaseCost: 45,
    wastageFactor: 0.05,
    gstRate: 0.10
  };

  // Width ranges for "4 door base" (in sort_order)
  const widthRanges = [
    { label: "600 - 649", min_width_mm: 600, sort_order: 0 },
    { label: "650 - 699", min_width_mm: 650, sort_order: 1 },
    { label: "700 - 749", min_width_mm: 700, sort_order: 2 },
    { label: "750 - 799", min_width_mm: 750, sort_order: 3 },
    { label: "800 - 849", min_width_mm: 800, sort_order: 4 },
    // ... more ranges
  ];

  const calculatePrice = (width_mm: number, rangeLabel: string) => {
    const widthM = width_mm / 1000;
    const heightM = cabinetData.default_height_mm / 1000;
    const depthM = cabinetData.default_depth_mm / 1000;

    // Carcass costs
    const backCost = (widthM * heightM) * cabinetData.backs_qty * settings.hmrRate;
    const bottomCost = (widthM * depthM) * cabinetData.bottoms_qty * settings.hmrRate;
    const sideCost = (depthM * heightM) * cabinetData.sides_qty * settings.hmrRate;
    
    // Door cost (no door style/finish/color configured, only carcass material)
    const doorStyleRate = 0; // No door style configured
    const finishRate = 0; // No finish configured
    const colorSurcharge = 0; // No color configured
    const totalDoorRate = doorStyleRate + finishRate + colorSurcharge;
    const doorCost = (widthM * heightM) * cabinetData.door_qty * totalDoorRate;
    
    const hardwareCost = settings.hardwareBaseCost;
    const subtotal = backCost + bottomCost + sideCost + doorCost + hardwareCost;
    const subtotalWithWastage = subtotal * (1 + settings.wastageFactor);
    const totalCost = subtotalWithWastage * (1 + settings.gstRate);

    return {
      rangeLabel,
      width_mm,
      widthM,
      backCost,
      bottomCost,
      sideCost,
      doorCost,
      hardwareCost,
      subtotal,
      totalCost,
      breakdown: {
        dimensions: `${widthM.toFixed(3)}m × ${heightM.toFixed(3)}m × ${depthM.toFixed(3)}m`,
        doorRate: totalDoorRate
      }
    };
  };

  const calculations = widthRanges.slice(0, 5).map(range => 
    calculatePrice(range.min_width_mm, range.label)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔍 Actual Frontend Calculation Logic</CardTitle>
        <p className="text-sm text-muted-foreground">
          Shows how the frontend SHOULD calculate prices using the minimum width from each range
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Key Logic */}
          <div className="bg-blue-50 p-4 rounded">
            <div className="font-semibold mb-2">Frontend Logic:</div>
            <div className="text-sm space-y-1">
              <div>✅ <strong>Width Source:</strong> Uses range.min_width_mm (first number in range)</div>
              <div>✅ <strong>Cabinet:</strong> "4 door base" (door_qty = 1)</div>
              <div>✅ <strong>Door Rate:</strong> $0 + $0 + $0 + $200 = $200/m² (only carcass material)</div>
              <div>✅ <strong>Formula:</strong> Same as admin breakdown</div>
            </div>
          </div>

          {/* Price Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-gray-300 px-4 py-3 text-left">Width Range</th>
                  <th className="border border-gray-300 px-4 py-3 text-center">Width Used</th>
                  <th className="border border-gray-300 px-4 py-3 text-center">Back Cost</th>
                  <th className="border border-gray-300 px-4 py-3 text-center">Bottom Cost</th>
                  <th className="border border-gray-300 px-4 py-3 text-center">Side Cost</th>
                  <th className="border border-gray-300 px-4 py-3 text-center">Door Cost</th>
                  <th className="border border-gray-300 px-4 py-3 text-center">Total Price</th>
                </tr>
              </thead>
              <tbody>
                {calculations.map((calc, index) => (
                  <tr key={index} className={calc.rangeLabel === "750 - 799" ? "bg-yellow-100" : "hover:bg-muted/50"}>
                    <td className="border border-gray-300 px-4 py-3 font-medium">
                      {calc.rangeLabel}
                      {calc.rangeLabel === "750 - 799" && (
                        <span className="ml-2 text-sm text-orange-600">← Target Range</span>
                      )}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <strong>{calc.width_mm}mm</strong>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      {formatPrice(calc.backCost)}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      {formatPrice(calc.bottomCost)}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      {formatPrice(calc.sideCost)}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      {formatPrice(calc.doorCost)}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center font-bold">
                      {formatPrice(calc.totalCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detailed 750mm Calculation */}
          <div className="bg-yellow-50 p-4 rounded border-2 border-yellow-300">
            <div className="font-semibold text-lg mb-3">🎯 "750 - 799" Range Calculation (Using 750mm):</div>
            {calculations.find(c => c.rangeLabel === "750 - 799") && (
              <div className="space-y-2 text-sm font-mono">
                <div><strong>Dimensions:</strong> {calculations.find(c => c.rangeLabel === "750 - 799")?.breakdown.dimensions}</div>
                <div><strong>Back Cost:</strong> (0.750 × 0.720) × 1 × $1000 = {formatPrice(calculations.find(c => c.rangeLabel === "750 - 799")!.backCost)}</div>
                <div><strong>Bottom Cost:</strong> (0.750 × 0.560) × 1 × $1000 = {formatPrice(calculations.find(c => c.rangeLabel === "750 - 799")!.bottomCost)}</div>
                <div><strong>Side Cost:</strong> (0.560 × 0.720) × 2 × $1000 = {formatPrice(calculations.find(c => c.rangeLabel === "750 - 799")!.sideCost)}</div>
                <div><strong>Door Cost:</strong> (0.750 × 0.720) × 1 × $200 = {formatPrice(calculations.find(c => c.rangeLabel === "750 - 799")!.doorCost)}</div>
                <div><strong>Hardware:</strong> {formatPrice(calculations.find(c => c.rangeLabel === "750 - 799")!.hardwareCost)}</div>
                <hr className="my-2" />
                <div className="text-lg font-bold text-blue-600">
                  <strong>TOTAL: {formatPrice(calculations.find(c => c.rangeLabel === "750 - 799")!.totalCost)}</strong>
                </div>
              </div>
            )}
          </div>

          {/* If Frontend Shows Different */}
          <div className="bg-red-50 p-4 rounded border border-red-200">
            <div className="font-semibold text-red-800 mb-2">If Frontend Shows $2,203.74:</div>
            <div className="text-sm text-red-700">
              The frontend may be using a different width or door configuration. Check:
              <div className="ml-4 mt-2 space-y-1">
                <div>• Which door styles are actually selected for "4 door base"</div>
                <div>• If any colors have surcharge rates configured</div>
                <div>• If door_style_finishes are properly linked</div>
                <div>• Console logs showing actual calculation values</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActualFrontendCalculation;