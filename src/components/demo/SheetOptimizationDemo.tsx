import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MaterialSheetOptimizer } from '@/components/checkout/MaterialSheetOptimizer';
import { EnhancedShippingCalculator } from '@/components/checkout/EnhancedShippingCalculator';
import { Plus, Minus } from 'lucide-react';

interface DemoItem {
  id: string;
  cabinetTypeId: string;
  width_mm: number;
  height_mm: number;
  depth_mm: number;
  doorStyleId: string;
  quantity: number;
  name: string;
}

export const SheetOptimizationDemo: React.FC = () => {
  const [demoItems, setDemoItems] = useState<DemoItem[]>([
    {
      id: '1',
      cabinetTypeId: 'base-cabinet-1',
      width_mm: 600,
      height_mm: 720,
      depth_mm: 560,
      doorStyleId: 'shaker-18mm',
      quantity: 2,
      name: '600mm Base Cabinet'
    },
    {
      id: '2',
      cabinetTypeId: 'top-cabinet-1',
      width_mm: 800,
      height_mm: 900,
      depth_mm: 320,
      doorStyleId: 'shaker-18mm',
      quantity: 1,
      name: '800mm Top Cabinet'
    }
  ]);

  const [newItem, setNewItem] = useState<Partial<DemoItem>>({
    width_mm: 600,
    height_mm: 720,
    depth_mm: 560,
    quantity: 1,
    name: 'Custom Cabinet'
  });

  const addItem = () => {
    if (newItem.width_mm && newItem.height_mm && newItem.depth_mm && newItem.name) {
      const item: DemoItem = {
        id: Date.now().toString(),
        cabinetTypeId: 'demo-cabinet',
        doorStyleId: 'shaker-18mm',
        ...newItem as Required<typeof newItem>
      };
      setDemoItems([...demoItems, item]);
      setNewItem({
        width_mm: 600,
        height_mm: 720,
        depth_mm: 560,
        quantity: 1,
        name: 'Custom Cabinet'
      });
    }
  };

  const removeItem = (id: string) => {
    setDemoItems(demoItems.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setDemoItems(demoItems.map(item => 
      item.id === id 
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    ));
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Material Sheet Optimization Demo</CardTitle>
          <p className="text-muted-foreground">
            This demo shows how door style thickness and weight per square meter are used 
            to optimize cabinet parts on 2400×1200mm HMR sheets for accurate packaging and shipping.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Items */}
          <div>
            <h3 className="text-lg font-medium mb-4">Current Items</h3>
            <div className="space-y-2">
              {demoItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {item.width_mm}×{item.height_mm}×{item.depth_mm}mm
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, -1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add New Item */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add Custom Item</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={newItem.name || ''}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="Cabinet name"
                  />
                </div>
                <div>
                  <Label>Width (mm)</Label>
                  <Input
                    type="number"
                    value={newItem.width_mm || ''}
                    onChange={(e) => setNewItem({ ...newItem, width_mm: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Height (mm)</Label>
                  <Input
                    type="number"
                    value={newItem.height_mm || ''}
                    onChange={(e) => setNewItem({ ...newItem, height_mm: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Depth (mm)</Label>
                  <Input
                    type="number"
                    value={newItem.depth_mm || ''}
                    onChange={(e) => setNewItem({ ...newItem, depth_mm: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={addItem} className="w-full">
                    Add Item
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Material Sheet Optimization */}
      {demoItems.length > 0 && (
        <MaterialSheetOptimizer
          items={demoItems}
          onOptimizationComplete={(packages) => {
            console.log('Optimization complete:', packages);
          }}
        />
      )}

      {/* Enhanced Shipping Calculator */}
      {demoItems.length > 0 && (
        <EnhancedShippingCalculator
          items={demoItems}
          enableMaterialOptimization={true}
          onShippingCalculated={(cost, method) => {
            console.log('Shipping calculated:', { cost, method });
          }}
        />
      )}

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium">1. Door Style Properties</h4>
            <p className="text-muted-foreground">
              Each door style has thickness (mm) and material density (kg/m²) properties that are used for calculations.
            </p>
          </div>
          <div>
            <h4 className="font-medium">2. Sheet Optimization</h4>
            <p className="text-muted-foreground">
              Cabinet parts are arranged on 2400×1200mm sheets with 85% efficiency target. 
              The thickness determines stack height and weight per square meter calculates total weight.
            </p>
          </div>
          <div>
            <h4 className="font-medium">3. Package Dimensions</h4>
            <p className="text-muted-foreground">
              Final packages use sheet dimensions (2400×1200mm) with calculated stack height based on 
              material thickness, plus 100mm packaging padding.
            </p>
          </div>
          <div>
            <h4 className="font-medium">4. Shipping Integration</h4>
            <p className="text-muted-foreground">
              Optimized packages are used for accurate shipping quotes, considering real dimensions and weights.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};