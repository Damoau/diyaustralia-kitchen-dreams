import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/pricing";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const PriceRoundingDemo = () => {
  const samplePrices = [
    { original: 1234.56, label: "Basic Cabinet" },
    { original: 2999.89, label: "Premium Cabinet" },
    { original: 1500.23, label: "Mid-range Cabinet" },
    { original: 999.99, label: "Budget Cabinet" },
    { original: 4567.12, label: "Luxury Cabinet" }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-green-600">✅ Price Rounding Applied</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              All prices in tables are now rounded to the nearest dollar (no cents displayed).
            </AlertDescription>
          </Alert>

          <div className="bg-green-50 p-4 rounded">
            <div className="font-semibold text-green-800 mb-3">Before vs After Examples:</div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-gray-300 px-4 py-2 text-left">Cabinet</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Before (with cents)</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">After (rounded)</th>
                  </tr>
                </thead>
                <tbody>
                  {samplePrices.map((price, index) => (
                    <tr key={index} className="hover:bg-muted/50">
                      <td className="border border-gray-300 px-4 py-2 font-medium">
                        {price.label}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center text-red-600">
                        ${price.original.toFixed(2)}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center text-green-600 font-bold">
                        {formatPrice(price.original)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded">
            <div className="font-semibold text-blue-800 mb-2">What Changed:</div>
            <div className="space-y-1 text-sm text-blue-700">
              <div>✅ <strong>formatPrice() function:</strong> Now rounds to nearest dollar</div>
              <div>✅ <strong>Price calculations:</strong> Return whole numbers</div>
              <div>✅ <strong>All price tables:</strong> Show rounded amounts</div>
              <div>✅ <strong>Frontend pricing:</strong> Updated automatically</div>
              <div>✅ <strong>Admin breakdowns:</strong> Rounded prices</div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
            <div className="font-semibold text-yellow-800 mb-2">Rounding Rules:</div>
            <div className="space-y-1 text-sm text-yellow-700 font-mono">
              <div>$1234.56 → <strong>$1,235</strong> (rounds up)</div>
              <div>$2999.12 → <strong>$2,999</strong> (rounds down)</div>
              <div>$1500.50 → <strong>$1,501</strong> (rounds up at .50)</div>
              <div>Uses JavaScript <code>Math.round()</code> function</div>
            </div>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Impact:</strong> All existing price tables, frontend pricing, admin panels, and CSV exports now show rounded dollar amounts. No code changes needed for individual components.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceRoundingDemo;