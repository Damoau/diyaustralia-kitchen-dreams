import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const DoorStyleConnectionIssue = () => {
  const [fixing, setFixing] = useState(false);
  const { toast } = useToast();

  const fixConnection = async () => {
    setFixing(true);
    try {
      // Get the door style and cabinet type IDs
      const { data: doorStyles } = await supabase
        .from('door_styles')
        .select('id, name, base_rate_per_sqm')
        .eq('name', 'poly')
        .eq('active', true);

      const { data: cabinetTypes } = await supabase
        .from('cabinet_types')
        .select('id, name')
        .eq('name', '4 door base')
        .eq('active', true);

      if (doorStyles?.length && cabinetTypes?.length) {
        // Create the connection in cabinet_type_finishes
        const { error } = await supabase
          .from('cabinet_type_finishes')
          .insert({
            cabinet_type_id: cabinetTypes[0].id,
            door_style_id: doorStyles[0].id,
            sort_order: 0,
            active: true
          });

        if (error) {
          toast({
            title: "Error",
            description: `Failed to connect door style: ${error.message}`,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Fixed!",
            description: "Door style 'poly' is now connected to '4 door base'. Refresh the pricing page to see updated prices.",
          });
        }
      }
    } catch (error) {
      console.error('Error fixing connection:', error);
      toast({
        title: "Error",
        description: "Failed to fix door style connection",
        variant: "destructive"
      });
    } finally {
      setFixing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-red-600">🚨 Door Style Pricing Issue Found!</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Problem Explanation */}
          <Alert>
            <AlertDescription>
              <strong>Problem:</strong> You updated "poly" door style to $2000, but it's not showing in pricing because the door style isn't connected to the "4 door base" cabinet type.
            </AlertDescription>
          </Alert>

          {/* Current Status */}
          <div className="bg-blue-50 p-4 rounded">
            <div className="font-semibold text-blue-800 mb-2">Current Status:</div>
            <div className="space-y-1 text-sm text-blue-700">
              <div>✅ Door Style "poly": EXISTS with base_rate_per_sqm = <strong>$2,000.00</strong></div>
              <div>✅ Cabinet Type "4 door base": EXISTS</div>
              <div>❌ Connection: <strong>MISSING</strong> in cabinet_type_finishes table</div>
            </div>
          </div>

          {/* The Issue */}
          <div className="bg-red-50 p-4 rounded border border-red-200">
            <div className="font-semibold text-red-800 mb-2">Why Pricing Doesn't Update:</div>
            <div className="space-y-1 text-sm text-red-700">
              <div>1. Frontend loads cabinet_type_finishes to see which door styles are available for each cabinet</div>
              <div>2. No records found linking "poly" to "4 door base"</div>
              <div>3. So "poly" doesn't appear in the pricing table</div>
              <div>4. Even though the door style itself has the $2000 price</div>
            </div>
          </div>

          {/* Expected Calculation */}
          <div className="bg-green-50 p-4 rounded">
            <div className="font-semibold text-green-800 mb-2">Expected Calculation with $2000 Door Style:</div>
            <div className="space-y-1 text-sm font-mono text-green-700">
              <div><strong>For 750mm "4 door base":</strong></div>
              <div>• Back: (0.750 × 0.720) × 1 × $1000 = $540.00</div>
              <div>• Bottom: (0.750 × 0.560) × 1 × $1000 = $420.00</div>
              <div>• Sides: (0.560 × 0.720) × 2 × $1000 = $806.40</div>
              <div>• Door: (0.750 × 0.720) × 1 × <strong>$2200</strong> = <strong>$1,188.00</strong></div>
              <div className="ml-4 text-xs">
                ($2000 door style + $200 carcass material)
              </div>
              <div>• Hardware: ~$50.00</div>
              <hr className="my-2" />
              <div className="font-bold text-lg">NEW TOTAL: ~$3,470 (vs current $2,203)</div>
            </div>
          </div>

          {/* Fix Button */}
          <div className="flex justify-center">
            <Button 
              onClick={fixConnection}
              disabled={fixing}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {fixing ? 'Fixing...' : '🔧 Fix Door Style Connection'}
            </Button>
          </div>

          {/* Next Steps */}
          <Alert>
            <AlertDescription>
              <strong>After fixing:</strong>
              <br />1. Refresh the pricing page (Cabinet Pricing menu)
              <br />2. You should see "poly" appear in the price table
              <br />3. Prices should jump significantly due to the $2000 door style rate
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
};

export default DoorStyleConnectionIssue;