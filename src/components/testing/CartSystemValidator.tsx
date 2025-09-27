import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, TestTube } from 'lucide-react';
import { useCartOptimized } from '@/hooks/useCartOptimized';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

export const CartSystemValidator = () => {
  const { user } = useAuth();
  const { cart, addToCart, refreshCart } = useCartOptimized();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const runTests = async () => {
    setTesting(true);
    const testResults: TestResult[] = [];

    try {
      // Test 1: Cart existence
      testResults.push({
        name: 'Cart Exists',
        passed: !!cart,
        message: cart ? `Cart found with ${cart.items?.length || 0} items` : 'No cart found'
      });

      // Test 2: Add item functionality
      let addTestPassed = false;
      let addTestMessage = '';
      
      try {
        // Try to add a test item (we'll use fake data for testing)
        const initialItemCount = cart?.items?.length || 0;
        
        addToCart({
          cabinet_type_id: '12345678-1234-1234-1234-123456789012', // Test UUID
          door_style_id: '12345678-1234-1234-1234-123456789012',
          color_id: '12345678-1234-1234-1234-123456789012',
          finish_id: '12345678-1234-1234-1234-123456789012',
          width_mm: 600,
          height_mm: 720,
          depth_mm: 560,
          quantity: 1,
          unit_price: 250,
          total_price: 250,
          notes: 'Test item - should be removed'
        });
        
        // Wait for mutation to process
        await new Promise(resolve => setTimeout(resolve, 1000));
        await refreshCart();
        
        const newItemCount = cart?.items?.length || 0;
        addTestPassed = newItemCount > initialItemCount;
        addTestMessage = addTestPassed 
          ? `Successfully added test item (${initialItemCount} → ${newItemCount})`
          : 'Failed to add test item';
      } catch (error) {
        addTestMessage = `Add test failed: ${error}`;
      }

      testResults.push({
        name: 'Add to Cart',
        passed: addTestPassed,
        message: addTestMessage
      });

      // Test 3: Cart data structure
      const hasValidStructure = cart && typeof cart.id === 'string' && Array.isArray(cart.items);
      testResults.push({
        name: 'Valid Structure',
        passed: hasValidStructure,
        message: hasValidStructure ? 'Cart has valid structure' : 'Cart structure is invalid'
      });

      // Test 4: User/Session identification
      const hasIdentifier = (user && cart?.user_id) || (!user && cart?.session_id);
      testResults.push({
        name: 'User/Session ID',
        passed: !!hasIdentifier,
        message: hasIdentifier 
          ? `Properly identified: ${user ? 'User ID' : 'Session ID'}`
          : 'Missing user/session identification'
      });

    } catch (error) {
      testResults.push({
        name: 'Test Suite',
        passed: false,
        message: `Test suite failed: ${error}`
      });
    }

    setResults(testResults);
    setTesting(false);

    const passedCount = testResults.filter(r => r.passed).length;
    const totalCount = testResults.length;
    
    if (passedCount === totalCount) {
      toast.success(`All ${totalCount} tests passed! Cart system is working correctly.`);
    } else {
      toast.error(`${totalCount - passedCount} of ${totalCount} tests failed. Cart system needs attention.`);
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Cart System Validator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={runTests}
          disabled={testing}
          className="w-full"
        >
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Running Tests...
            </>
          ) : (
            <>
              <TestTube className="w-4 h-4 mr-2" />
              Validate Cart System
            </>
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Test Results:</h4>
            {results.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded border">
                <span className="text-sm font-medium">{result.name}</span>
                <div className="flex items-center gap-2">
                  {result.passed ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <Badge variant={result.passed ? "default" : "destructive"}>
                    {result.passed ? "PASS" : "FAIL"}
                  </Badge>
                </div>
              </div>
            ))}
            
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Current Cart: {cart?.items?.length || 0} items, Total: ${cart?.total_amount || 0}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};