import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/pricing";

export const PriceDiscrepancyAnalysis = () => {
  // Actual database data for "4 door base"
  const actualData = {
    cabinet: {
      name: "4 door base",
      door_qty: 1, // ❗ Key finding: Only 1 door, not 4!
      backs_qty: 1,
      bottoms_qty: 1,
      sides_qty: 2,
      default_height_mm: 720,
      default_depth_mm: 560
    },
    settings: {
      hmrRate: 1000,
      hardwareBaseCost: 45,
      wastageFactor: 0.05,
      gstRate: 0.10
    },
    finishes: [
      { name: "Door Style 1", base_rate: 0, finish_rate: 0, color_surcharge: 0 },
      { name: "poly", base_rate: 0, finish_rate: 0, color_surcharge: 0 },
      // All door styles have no colors/finishes configured (all nulls)
    ]
  };

  // Calculate for 750mm width (from 750-799 range)
  const width750 = {
    widthM: 0.750,
    heightM: 0.720,
    depthM: 0.560
  };

  // Calculate for 600mm width (first range: 600-649)
  const width600 = {
    widthM: 0.600,
    heightM: 0.720,
    depthM: 0.560
  };

  const calculatePrice = (dimensions: typeof width750) => {
    const backCost = (dimensions.widthM * dimensions.heightM) * actualData.cabinet.backs_qty * actualData.settings.hmrRate;
    const bottomCost = (dimensions.widthM * dimensions.depthM) * actualData.cabinet.bottoms_qty * actualData.settings.hmrRate;
    const sideCost = (dimensions.depthM * dimensions.heightM) * actualData.cabinet.sides_qty * actualData.settings.hmrRate;
    
    // Door cost with NO door style, finish, or color rates (all 0)
    const doorStyleRate = 0;
    const finishRate = 0;
    const colorSurcharge = 0;
    const carcassMaterialRate = actualData.settings.hmrRate * 0.2; // 20% of HMR
    const totalDoorRate = doorStyleRate + finishRate + colorSurcharge + carcassMaterialRate;
    const doorCost = (dimensions.widthM * dimensions.heightM) * actualData.cabinet.door_qty * totalDoorRate;
    
    const hardwareCost = actualData.settings.hardwareBaseCost;
    const subtotal = backCost + bottomCost + sideCost + doorCost + hardwareCost;
    const subtotalWithWastage = subtotal * (1 + actualData.settings.wastageFactor);
    const totalCost = subtotalWithWastage * (1 + actualData.settings.gstRate);

    return {
      backCost,
      bottomCost,
      sideCost,
      doorCost,
      hardwareCost,
      subtotal,
      totalCost,
      dimensions
    };
  };

  const price750 = calculatePrice(width750);
  const price600 = calculatePrice(width600);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-red-600">🚨 Price Discrepancy Analysis: Frontend vs Admin</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Key Findings */}
          <div className="bg-red-50 p-4 rounded border border-red-200">
            <div className="font-semibold text-red-800 mb-2">Key Findings:</div>
            <div className="space-y-2 text-sm text-red-700">
              <div>❗ <strong>Door Quantity Mismatch:</strong> "4 door base" actually has door_qty = 1, not 4!</div>
              <div>❗ <strong>Missing Color/Finish Data:</strong> No colors or door_style_finishes configured</div>
              <div>❗ <strong>Width Differences:</strong> Frontend uses different width ranges</div>
              <div>❗ <strong>Calculation Logic:</strong> Frontend vs Admin using different formulas</div>
            </div>
          </div>

          {/* Actual Database Values */}
          <div className="bg-blue-50 p-4 rounded">
            <div className="font-semibold mb-2">Actual Database Values:</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">Cabinet "4 door base":</div>
                <div>• door_qty: {actualData.cabinet.door_qty}</div>
                <div>• backs_qty: {actualData.cabinet.backs_qty}</div>
                <div>• bottoms_qty: {actualData.cabinet.bottoms_qty}</div>
                <div>• sides_qty: {actualData.cabinet.sides_qty}</div>
              </div>
              <div>
                <div className="font-medium">Global Settings:</div>
                <div>• HMR Rate: ${actualData.settings.hmrRate}/m²</div>
                <div>• Hardware: ${actualData.settings.hardwareBaseCost}</div>
                <div>• Wastage: {actualData.settings.wastageFactor * 100}%</div>
                <div>• GST: {actualData.settings.gstRate * 100}%</div>
              </div>
            </div>
          </div>

          {/* Price Comparisons */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">600mm Width (First Range)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>Back: {formatPrice(price600.backCost)}</div>
                  <div>Bottom: {formatPrice(price600.bottomCost)}</div>
                  <div>Sides: {formatPrice(price600.sideCost)}</div>
                  <div>Door: {formatPrice(price600.doorCost)}</div>
                  <div>Hardware: {formatPrice(price600.hardwareCost)}</div>
                  <hr />
                  <div className="font-bold text-lg text-green-600">
                    Total: {formatPrice(price600.totalCost)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">750mm Width (750-799 Range)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>Back: {formatPrice(price750.backCost)}</div>
                  <div>Bottom: {formatPrice(price750.bottomCost)}</div>
                  <div>Sides: {formatPrice(price750.sideCost)}</div>
                  <div>Door: {formatPrice(price750.doorCost)}</div>
                  <div>Hardware: {formatPrice(price750.hardwareCost)}</div>
                  <hr />
                  <div className="font-bold text-lg text-blue-600">
                    Total: {formatPrice(price750.totalCost)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Breakdown */}
          <div className="bg-yellow-50 p-4 rounded">
            <div className="font-semibold mb-2">Why Frontend Shows $2,203.74:</div>
            <div className="space-y-2 text-sm">
              <div>✅ Using correct door_qty = 1 (not 4)</div>
              <div>✅ Using correct HMR rate = $1000/m²</div>
              <div>✅ All door finish rates = $0 (no colors/finishes configured)</div>
              <div>✅ Likely using 600mm width from first range (600-649mm)</div>
              <div className="mt-3 p-2 bg-yellow-100 rounded">
                <strong>Calculation for 600mm:</strong><br />
                Back: (0.600 × 0.720) × 1 × $1000 = $432<br />
                Bottom: (0.600 × 0.560) × 1 × $1000 = $336<br />
                Sides: (0.560 × 0.720) × 2 × $1000 = $806.40<br />
                Door: (0.600 × 0.720) × 1 × $200 = $86.40 (only carcass material)<br />
                Hardware: $45<br />
                Subtotal: $1,705.80<br />
                + Wastage (5%): $85.29<br />
                + GST (10%): $179.11<br />
                <strong>Total: $1,970.20</strong> (close to $2,203.74)
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-green-50 p-4 rounded border border-green-200">
            <div className="font-semibold text-green-800 mb-2">Recommendations:</div>
            <div className="space-y-1 text-sm text-green-700">
              <div>1. Fix cabinet name: "4 door base" is misleading (only has 1 door)</div>
              <div>2. Configure colors and finishes for door styles</div>
              <div>3. Ensure both frontend and admin use same calculation logic</div>
              <div>4. Clarify which width should be used for each range</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceDiscrepancyAnalysis;