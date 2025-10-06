import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, Trash2, Wrench, FileText, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '@/lib/formatPrice';
import { useState } from 'react';

interface EnhancedCartItemProps {
  item: any;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
  onNavigateToProduct?: (item: any) => void;
}

export const EnhancedCartItem = memo(({ item, onUpdateQuantity, onRemove, onNavigateToProduct }: EnhancedCartItemProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const [quantity, setQuantity] = useState(item.quantity);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity > 0) {
      setQuantity(newQuantity);
      onUpdateQuantity(newQuantity);
    }
  };

  const calculatedTotal = quantity * item.unit_price;
  const hasHardware = item.hardware_selections && item.hardware_selections.length > 0;
  const hasAssembly = item.configuration?.assembly?.enabled;
  const hasOptions = item.configuration?.productOptions && Object.keys(item.configuration.productOptions).length > 0;
  const hasNotes = item.notes || item.configuration?.notes;

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      {/* Main Item Row */}
      <div className="flex gap-3 p-3">
        {/* Cabinet Image */}
        <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
          {item.cabinet_type?.product_image_url ? (
            <img 
              src={item.cabinet_type.product_image_url} 
              alt={item.cabinet_type?.name || 'Cabinet'}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <Package className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Cabinet Name */}
          {onNavigateToProduct ? (
            <button 
              onClick={() => onNavigateToProduct(item)}
              className="font-semibold text-base leading-tight hover:text-primary cursor-pointer text-left w-full mb-1"
            >
              {item.cabinet_type?.name || 'Cabinet'}
            </button>
          ) : (
            <h3 className="font-semibold text-base leading-tight mb-1">
              {item.cabinet_type?.name || 'Cabinet'}
            </h3>
          )}
          
          {/* Basic Info */}
          <div className="text-sm text-muted-foreground space-y-0.5">
            <p className="font-medium">{item.cabinet_type?.category}</p>
            <p>Dimensions: {item.width_mm}×{item.height_mm}×{item.depth_mm}mm</p>
          </div>

          {/* Quick Style Preview */}
          <div className="flex flex-wrap gap-2 mt-2">
            {item.door_style?.name && (
              <Badge variant="secondary" className="text-xs">
                {item.door_style.name}
              </Badge>
            )}
            {item.color?.name && (
              <Badge variant="outline" className="text-xs">
                {item.color.name}
              </Badge>
            )}
            {item.finish?.name && (
              <Badge variant="outline" className="text-xs">
                {item.finish.name}
              </Badge>
            )}
          </div>

          {/* Show Details Toggle */}
          {(hasHardware || hasAssembly || hasOptions || hasNotes) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="mt-2 h-7 px-2 text-xs"
            >
              {showDetails ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Show Details
                </>
              )}
            </Button>
          )}

          {/* Unit Price */}
          <p className="text-sm font-medium mt-2 text-muted-foreground">
            {formatCurrency(item.unit_price, true)}
          </p>
        </div>
        
        {/* Right Column - Quantity & Price */}
        <div className="flex flex-col items-end justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
              className="h-8 w-8 p-0"
            >
              <Minus className="h-3 w-3" />
            </Button>
            
            <span className="text-sm font-medium w-10 text-center">
              {quantity}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuantityChange(quantity + 1)}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          
          <p className="text-base font-bold">
            {formatCurrency(calculatedTotal, true)}
          </p>
        </div>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="px-3 pb-3 pt-0">
          <Separator className="mb-3" />
          
          <div className="space-y-3 text-sm">
            {/* Style Details */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-1">
                <Package className="h-4 w-4" />
                Style & Finish
              </h4>
              <div className="pl-5 space-y-1 text-muted-foreground">
                {item.door_style?.name && <p>Door Style: {item.door_style.name}</p>}
                {item.color?.name && <p>Color: {item.color.name}</p>}
                {item.finish?.name && <p>Finish: {item.finish.name}</p>}
              </div>
            </div>

            {/* Hardware */}
            {hasHardware && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-1">
                  <Wrench className="h-4 w-4" />
                  Hardware
                </h4>
                <div className="pl-5 space-y-2">
                  {item.hardware_selections.map((hw: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-muted-foreground">
                      <span>
                        {hw.hardware_type}: {hw.hardware_products?.name || 'Standard'}
                        {hw.quantity > 1 && ` (×${hw.quantity})`}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(hw.total_price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assembly */}
            {hasAssembly && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-1">
                  <Wrench className="h-4 w-4" />
                  Assembly Service
                </h4>
                <div className="pl-5 space-y-1 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>
                      {item.configuration.assembly.type === 'carcass_only' 
                        ? 'Carcass Assembly' 
                        : 'Complete Assembly'}
                    </span>
                    <span className="font-medium text-primary">
                      +{formatCurrency(item.configuration.assembly.price || 0)}
                    </span>
                  </div>
                  {item.configuration.assembly.postcode && (
                    <p className="text-xs">Delivery to: {item.configuration.assembly.postcode}</p>
                  )}
                </div>
              </div>
            )}

            {/* Product Options (Enhanced Display) */}
            {hasOptions && (
              <div>
                <h4 className="font-semibold mb-2">Product Options</h4>
                <div className="pl-5 space-y-1.5">
                  {Object.entries(item.configuration.productOptions).map(([key, value]: [string, any]) => {
                    // Format display based on value type
                    let displayValue = '';
                    let priceAdjustment = null;
                    let isHidden = false;

                    if (typeof value === 'object') {
                      displayValue = value.label || value.value || JSON.stringify(value);
                      priceAdjustment = value.price;
                      isHidden = value.hidden;
                    } else {
                      displayValue = String(value);
                    }

                    return (
                      <div key={key} className="flex justify-between items-start">
                        <div className="flex-1">
                          <span className="text-muted-foreground">
                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:{' '}
                            <span className="text-foreground font-medium">{displayValue}</span>
                          </span>
                          {isHidden && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Included
                            </Badge>
                          )}
                        </div>
                        {priceAdjustment && priceAdjustment > 0 && (
                          <span className="font-medium text-primary ml-2">
                            +{formatCurrency(priceAdjustment)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notes */}
            {hasNotes && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  Notes
                </h4>
                <div className="pl-5 text-muted-foreground whitespace-pre-wrap break-words bg-muted p-2 rounded text-xs">
                  {item.notes || item.configuration?.notes}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

EnhancedCartItem.displayName = 'EnhancedCartItem';
