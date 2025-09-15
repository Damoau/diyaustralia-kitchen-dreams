import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Trash2, Package } from 'lucide-react';
import { CartItem } from '@/types/cabinet';
import { formatPrice } from '@/lib/pricing';

interface ProductCartItemProps {
  item: CartItem;
  onQuantityChange: (itemId: string, newQuantity: number) => void;
  onRemove: (itemId: string) => void;
}

export function ProductCartItem({ item, onQuantityChange, onRemove }: ProductCartItemProps) {
  const isProductBased = item.is_product_based || item.product_variant;
  
  // Parse configuration if it's a JSON string
  let config: any = {};
  try {
    if (typeof item.configuration === 'string') {
      config = JSON.parse(item.configuration);
    } else {
      config = item.configuration || {};
    }
  } catch (error) {
    console.error('Error parsing cart item configuration:', error);
  }

  const productOptions = config.productOptions || item.product_options || {};
  const productVariant = config.productVariant || item.product_variant;

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium truncate">
              {item.product_title || item.cabinet_type?.name}
            </h4>
            {isProductBased && (
              <Badge variant="secondary" className="text-xs">
                <Package className="h-3 w-3 mr-1" />
                Product
              </Badge>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground">
            {item.width_mm}×{item.height_mm}×{item.depth_mm}mm
          </p>

          {/* Product Options Display */}
          {isProductBased && Object.keys(productOptions).length > 0 && (
            <div className="mt-2 space-y-1">
              {Object.entries(productOptions).map(([optionName, optionValue]) => (
                <div key={optionName} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium">
                    {optionName}:
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {String(optionValue)}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {/* Legacy Options Display */}
          {!isProductBased && (
            <div className="mt-2 space-y-1">
              {item.finish && (
                <p className="text-sm text-muted-foreground">
                  Finish: {item.finish.name}
                </p>
              )}
              {item.color && (
                <p className="text-sm text-muted-foreground">
                  Color: {item.color.name}
                </p>
              )}
              {item.door_style && (
                <p className="text-sm text-muted-foreground">
                  Door Style: {item.door_style.name}
                </p>
              )}
            </div>
          )}

          {/* Product Variant Info */}
          {productVariant?.sku && (
            <p className="text-xs text-muted-foreground mt-1">
              SKU: {productVariant.sku}
            </p>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(item.id)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuantityChange(item.id, item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-8 text-center">{item.quantity}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuantityChange(item.id, item.quantity + 1)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        
        <div className="text-right">
          <p className="font-medium">{formatPrice(item.total_price)}</p>
          <p className="text-sm text-muted-foreground">
            {formatPrice(item.unit_price)} each
          </p>
        </div>
      </div>

      {/* Additional Product Info */}
      {isProductBased && productVariant && (
        <div className="pt-2 border-t text-xs text-muted-foreground">
          {productVariant.lead_time_days && (
            <p>Lead Time: {productVariant.lead_time_days} days</p>
          )}
          {productVariant.weight_kg && (
            <p>Weight: {productVariant.weight_kg}kg</p>
          )}
        </div>
      )}
    </div>
  );
}