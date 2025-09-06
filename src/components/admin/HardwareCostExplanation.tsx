import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatPrice } from "@/lib/pricing";

export const HardwareCostExplanation = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-orange-600">🔧 Hardware Cost: Where the $45.00 Comes From</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current Fallback System */}
            <Alert>
              <AlertDescription>
                <strong>Current Issue:</strong> The $45.00 comes from <code>global_settings.hardware_base_cost</code> because no specific hardware requirements are configured for "4 door base".
              </AlertDescription>
            </Alert>

            {/* Before/After Comparison */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-600 text-lg">❌ BEFORE (Current)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div><strong>Hardware Requirements:</strong> None configured</div>
                    <div><strong>Hardware Selection:</strong> Not available in UI</div>
                    <div><strong>Cost Calculation:</strong> Fallback to $45.00</div>
                    <div><strong>Source:</strong> global_settings.hardware_base_cost</div>
                    <div className="mt-3 p-2 bg-red-50 rounded">
                      <strong>Total Hardware Cost: {formatPrice(45)}</strong>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-600 text-lg">✅ AFTER (Fixed)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div><strong>Hardware Requirements:</strong> Configured for "4 door base"</div>
                    <div><strong>Hardware Selection:</strong> Available in frontend</div>
                    <div><strong>Cost Calculation:</strong> Based on actual products</div>
                    <div><strong>Source:</strong> hardware_products.cost_per_unit</div>
                    <div className="mt-3 p-2 bg-green-50 rounded">
                      <strong>Example Cost: Varies by brand (e.g., $65-120)</strong>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Hardware Requirements Created */}
            <div className="bg-blue-50 p-4 rounded">
              <div className="font-semibold text-blue-800 mb-2">✅ Hardware Requirements Now Created:</div>
              <div className="space-y-2 text-sm text-blue-700">
                <div><strong>For "4 door base" cabinet:</strong></div>
                <div>• <strong>Hinges:</strong> 2 per door × 1 door = 2 hinges total</div>
                <div>• <strong>Handles:</strong> 1 per door × 1 door = 1 handle total</div>
                <div className="mt-2 text-xs">
                  <em>Note: Remember "4 door base" actually has door_qty = 1, not 4 doors!</em>
                </div>
              </div>
            </div>

            {/* How It Will Work Now */}
            <div className="bg-green-50 p-4 rounded">
              <div className="font-semibold text-green-800 mb-2">🎯 How Hardware Selection Will Work:</div>
              <div className="space-y-2 text-sm text-green-700">
                <div>1. <strong>Frontend:</strong> Hardware brand selector will show (Blum, Titus, Hettich)</div>
                <div>2. <strong>Calculation:</strong> System will look up actual product costs</div>
                <div>3. <strong>Formula:</strong> (hinges × hinge_cost) + (handles × handle_cost)</div>
                <div>4. <strong>Brands:</strong> Different brands = different costs</div>
              </div>
            </div>

            {/* Example Calculation */}
            <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
              <div className="font-semibold mb-2">📊 Example Hardware Cost Calculation:</div>
              <div className="space-y-2 text-sm font-mono">
                <div><strong>Blum Brand Example:</strong></div>
                <div>• Soft Close Hinges: 2 units × $15 = $30</div>
                <div>• Cabinet Handles: 1 unit × $25 = $25</div>
                <div>• <strong>Total Hardware: $55</strong> (instead of $45)</div>
                
                <div className="mt-3"><strong>Titus Brand Example:</strong></div>
                <div>• Soft Close Hinges: 2 units × $22 = $44</div>
                <div>• Cabinet Handles: 1 unit × $35 = $35</div>
                <div>• <strong>Total Hardware: $79</strong> (premium option)</div>
              </div>
            </div>

            {/* Next Steps */}
            <Alert>
              <AlertDescription>
                <strong>Next Steps:</strong>
                <br />1. Add hardware products with costs for each brand
                <br />2. Test the frontend hardware selector
                <br />3. Verify pricing updates dynamically based on hardware selection
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HardwareCostExplanation;