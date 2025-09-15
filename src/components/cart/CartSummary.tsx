import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, ShoppingCart, Wrench, Palette } from 'lucide-react';
import { CartItem } from '@/types/cabinet';
import { formatPrice } from '@/lib/pricing';

interface CartSummaryProps {
  cartItems: CartItem[];
  totalAmount: number;
  totalItems: number;
}

export function CartSummary({ cartItems, totalAmount, totalItems }: CartSummaryProps) {
  // Analyze cart contents
  const productBasedItems = cartItems.filter(item => item.is_product_based || item.product_variant);
  const legacyItems = cartItems.filter(item => !item.is_product_based && !item.product_variant);
  
  const categories = cartItems.reduce((acc, item) => {
    const category = item.cabinet_type?.category || 'unknown';
    acc[category] = (acc[category] || 0) + item.quantity;
    return acc;
  }, {} as Record<string, number>);

  const uniqueOptions = new Set<string>();
  cartItems.forEach(item => {
    try {
      const config = typeof item.configuration === 'string' 
        ? JSON.parse(item.configuration) 
        : item.configuration || {};
      
      const productOptions = config.productOptions || item.product_options || {};
      
      Object.entries(productOptions).forEach(([key, value]) => {
        uniqueOptions.add(`${key}: ${value}`);
      });
      
      // Legacy options
      if (item.finish?.name) uniqueOptions.add(`Finish: ${item.finish.name}`);
      if (item.color?.name) uniqueOptions.add(`Color: ${item.color.name}`);
      if (item.door_style?.name) uniqueOptions.add(`Door Style: ${item.door_style.name}`);
    } catch (error) {
      console.error('Error parsing cart item configuration:', error);
    }
  });

  if (cartItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Your cart is empty</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Cart Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{totalItems}</div>
            <div className="text-sm text-muted-foreground">Total Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{formatPrice(totalAmount)}</div>
            <div className="text-sm text-muted-foreground">Total Value</div>
          </div>
        </div>

        <Separator />

        {/* System Types */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Configuration System
          </h4>
          <div className="space-y-2">
            {productBasedItems.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs">
                    Product System
                  </Badge>
                </div>
                <span className="text-sm">{productBasedItems.length} items</span>
              </div>
            )}
            {legacyItems.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Legacy System
                  </Badge>
                </div>
                <span className="text-sm">{legacyItems.length} items</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Categories */}
        <div>
          <h4 className="font-medium mb-3">Cabinet Categories</h4>
          <div className="space-y-2">
            {Object.entries(categories).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm capitalize">{category}</span>
                <Badge variant="outline" className="text-xs">
                  {count} {count === 1 ? 'item' : 'items'}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Options Summary */}
        {uniqueOptions.size > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Selected Options ({uniqueOptions.size})
              </h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {Array.from(uniqueOptions).slice(0, 8).map((option) => (
                  <Badge key={option} variant="outline" className="text-xs mr-1 mb-1">
                    {option}
                  </Badge>
                ))}
                {uniqueOptions.size > 8 && (
                  <div className="text-xs text-muted-foreground mt-2">
                    +{uniqueOptions.size - 8} more options
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Price Breakdown */}
        <Separator />
        <div>
          <h4 className="font-medium mb-3">Price Breakdown</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(totalAmount / 1.1)}</span> {/* Assuming 10% GST */}
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>GST (10%)</span>
              <span>{formatPrice(totalAmount - (totalAmount / 1.1))}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>{formatPrice(totalAmount)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}