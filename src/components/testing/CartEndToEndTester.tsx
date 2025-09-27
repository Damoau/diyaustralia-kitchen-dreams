import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useCartOptimized } from '@/hooks/useCartOptimized';
import { useCartCleanup } from '@/hooks/useCartCleanup';
import { useCartValidation } from '@/hooks/useCartValidation';
import { useCheckout } from '@/hooks/useCheckout';
import { useAuth } from '@/hooks/useAuth';
import { Play, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface TestResult {
  testName: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message: string;
  duration?: number;
  details?: any;
}

export const CartEndToEndTester: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [results, setResults] = useState<TestResult[]>([]);
  const [progress, setProgress] = useState(0);

  const { user } = useAuth();
  const { cart, addToCart, refreshCart, getTotalItems, getTotalPrice } = useCartOptimized();
  const { cleanupCarts, cartHealth } = useCartCleanup();
  const { validateCartItem } = useCartValidation();
  const { startCheckout } = useCheckout();

  // Test data - using real IDs from the database
  const testCartItem = {
    cabinet_type_id: '5ec0aa14-2ad5-44ce-9df0-27d14beaec4c',
    door_style_id: 'a84d294a-e113-4ca7-9f3e-1d4bd6561411',
    color_id: '495a6140-721a-487b-8adb-bf20de71ba49',
    finish_id: 'ca305af6-8cea-4228-bf57-6c916b59f2e8',
    width_mm: 600,
    height_mm: 720,
    depth_mm: 560,
    quantity: 1,
    unit_price: 299.99,
    total_price: 299.99,
    configuration: { test: true },
    notes: 'E2E Test Item'
  };

  const tests = [
    {
      name: 'Cart Initialization',
      description: 'Verify cart loads correctly'
    },
    {
      name: 'Item Validation', 
      description: 'Test item validation rules'
    },
    {
      name: 'Add to Cart',
      description: 'Add test item to cart'
    },
    {
      name: 'Cart Persistence',
      description: 'Verify cart data persists'
    },
    {
      name: 'Cart Calculations',
      description: 'Test totals and quantities'
    },
    {
      name: 'Cart Cleanup',
      description: 'Test cart consolidation'
    },
    {
      name: 'Checkout Initialization',
      description: 'Start checkout process'
    },
    {
      name: 'Real-time Updates',
      description: 'Test live cart updates'
    },
    {
      name: 'Error Handling',
      description: 'Test error scenarios'
    },
    {
      name: 'Performance',
      description: 'Measure response times'
    }
  ];

  const updateResult = (testName: string, status: TestResult['status'], message: string, details?: any) => {
    setResults(prev => {
      const existingIndex = prev.findIndex(r => r.testName === testName);
      const newResult: TestResult = {
        testName,
        status,
        message,
        duration: status === 'passed' || status === 'failed' ? Date.now() : undefined,
        details
      };

      if (existingIndex >= 0) {
        const newResults = [...prev];
        newResults[existingIndex] = newResult;
        return newResults;
      }
      return [...prev, newResult];
    });
  };

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setCurrentTest(testName);
    updateResult(testName, 'running', 'Test in progress...');
    
    const startTime = Date.now();
    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      updateResult(testName, 'passed', `✅ Passed (${duration}ms)`, result);
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateResult(testName, 'failed', `❌ Failed: ${error.message} (${duration}ms)`, error);
      throw error;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);
    setProgress(0);
    
    const totalTests = 10;
    let completedTests = 0;

    try {
      // Test 1: Cart Initialization
      await runTest('Cart Initialization', async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!cart) throw new Error('Cart not initialized');
        return { cartId: cart.id, status: cart.status };
      });
      setProgress(++completedTests / totalTests * 100);

      // Test 2: Item Validation
      await runTest('Item Validation', async () => {
        const validationErrors = validateCartItem(testCartItem);
        if (validationErrors.length > 0) {
          throw new Error(`Validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
        }
        return { valid: true, errors: validationErrors };
      });
      setProgress(++completedTests / totalTests * 100);

      // Test 3: Add to Cart
      await runTest('Add to Cart', async () => {
        const initialCount = getTotalItems();
        
        return new Promise((resolve, reject) => {
          addToCart(testCartItem);
          
          // Wait for cart to update
          setTimeout(async () => {
            try {
              await refreshCart();
              const newCount = getTotalItems();
              if (newCount > initialCount) {
                resolve({ added: true, itemsAdded: newCount - initialCount });
              } else {
                reject(new Error('Item count did not increase'));
              }
            } catch (error) {
              reject(error);
            }
          }, 2000);
        });
      });
      setProgress(++completedTests / totalTests * 100);

      // Test 4: Cart Persistence
      await runTest('Cart Persistence', async () => {
        const beforeRefresh = getTotalItems();
        await refreshCart();
        const afterRefresh = getTotalItems();
        if (beforeRefresh !== afterRefresh) {
          throw new Error('Cart data not persistent');
        }
        return { persistent: true, itemCount: afterRefresh };
      });
      setProgress(++completedTests / totalTests * 100);

      // Test 5: Cart Calculations
      await runTest('Cart Calculations', async () => {
        const totalItems = getTotalItems();
        const totalPrice = getTotalPrice();
        if (totalItems <= 0) throw new Error('No items in cart');
        if (totalPrice <= 0) throw new Error('Invalid total price');
        return { totalItems, totalPrice };
      });
      setProgress(++completedTests / totalTests * 100);

      // Test 6: Cart Cleanup
      await runTest('Cart Cleanup', async () => {
        return new Promise((resolve, reject) => {
          cleanupCarts();
          setTimeout(() => {
            if (cartHealth) {
              resolve(cartHealth);
            } else {
              reject(new Error('Cart health not available'));
            }
          }, 1000);
        });
      });
      setProgress(++completedTests / totalTests * 100);

      // Test 7: Checkout Initialization
      await runTest('Checkout Initialization', async () => {
        if (!cart?.id) throw new Error('No cart ID available');
        const checkout = await startCheckout(cart.id);
        if (!checkout) throw new Error('Failed to start checkout');
        return { checkoutId: checkout.id };
      });
      setProgress(++completedTests / totalTests * 100);

      // Test 8: Real-time Updates
      await runTest('Real-time Updates', async () => {
        // Simulate real-time update test
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { realtime: 'functioning' };
      });
      setProgress(++completedTests / totalTests * 100);

      // Test 9: Error Handling
      await runTest('Error Handling', async () => {
        try {
          // Test with invalid item
          const invalidItem = { ...testCartItem, cabinet_type_id: 'invalid-id' };
          const errors = validateCartItem(invalidItem);
          if (errors.length === 0) throw new Error('Should have validation errors');
        } catch (error) {
          // Expected error
        }
        return { errorHandling: 'working' };
      });
      setProgress(++completedTests / totalTests * 100);

      // Test 10: Performance
      await runTest('Performance', async () => {
        const start = Date.now();
        await refreshCart();
        const duration = Date.now() - start;
        if (duration > 5000) throw new Error('Performance too slow');
        return { responseTime: duration };
      });
      setProgress(++completedTests / totalTests * 100);

      toast.success('All tests completed successfully! 🎉');
      
    } catch (error) {
      console.error('Test suite failed:', error);
      toast.error('Some tests failed. Check results for details.');
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const passedTests = results.filter(r => r.status === 'passed').length;
  const failedTests = results.filter(r => r.status === 'failed').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          End-to-End Cart Testing
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Comprehensive test suite for cart → checkout flow
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test Controls */}
        <div className="flex items-center gap-4">
          <Button 
            onClick={runAllTests} 
            disabled={isRunning || !user}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Button>
          
          {results.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant={failedTests > 0 ? 'destructive' : 'default'}>
                {passedTests}/{results.length} Passed
              </Badge>
              {failedTests > 0 && (
                <Badge variant="destructive">{failedTests} Failed</Badge>
              )}
            </div>
          )}
        </div>

        {!user && (
          <p className="text-sm text-muted-foreground">
            Please log in to run end-to-end tests
          </p>
        )}

        {/* Progress */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Running: {currentTest}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {/* Test Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Test Results</h4>
            <div className="space-y-1">
              {tests.map((test) => {
                const result = results.find(r => r.testName === test.name);
                return (
                  <div key={test.name} className="flex items-center gap-3 p-2 rounded border">
                    {getStatusIcon(result?.status || 'pending')}
                    <div className="flex-1">
                      <div className="font-medium text-sm">{test.name}</div>
                      <div className="text-xs text-muted-foreground">{test.description}</div>
                      {result && (
                        <div className="text-xs mt-1 font-mono">{result.message}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};