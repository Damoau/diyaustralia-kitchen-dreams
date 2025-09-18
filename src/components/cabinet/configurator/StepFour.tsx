import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ShoppingCart, Plus, Minus, ChevronDown, ChevronUp } from "lucide-react";
import { CabinetType } from "@/types/cabinet";
import { PriceBreakdown } from "../PriceBreakdown";

interface StepFourProps {
  cabinetType: CabinetType;
  width: number;
  height: number;
  depth: number;
  quantity: number;
  selectedDoorStyleName: string;
  selectedColorName: string;
  selectedHardwareBrandName: string;
  price: number;
  priceBreakdown: any;
  isLoading: boolean;
  isAddingToCart: boolean;
  onQuantityChange: (value: number) => void;
  onAddToCart: () => void;
  isCorner?: boolean;
  rightSideWidth?: number;
  leftSideWidth?: number;
}

export function StepFour({
  cabinetType,
  width,
  height,
  depth,
  quantity,
  selectedDoorStyleName,
  selectedColorName,
  selectedHardwareBrandName,
  price,
  priceBreakdown,
  isLoading,
  isAddingToCart,
  onQuantityChange,
  onAddToCart,
  isCorner,
  rightSideWidth,
  leftSideWidth
}: StepFourProps) {
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);

  const isValid = selectedDoorStyleName && selectedColorName && selectedHardwareBrandName;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Review & Add to Cart</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Review your configuration and add to cart
        </p>
      </div>

      {/* Configuration Summary */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-3">
        <h4 className="font-medium">Configuration Summary</h4>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Cabinet:</span>
            <div className="font-medium">{cabinetType.name}</div>
          </div>
          
          <div>
            <span className="text-muted-foreground">Door Style:</span>
            <div className="font-medium">{selectedDoorStyleName || 'Not selected'}</div>
          </div>
          
          <div>
            <span className="text-muted-foreground">Color:</span>
            <div className="font-medium">{selectedColorName || 'Not selected'}</div>
          </div>
          
          <div>
            <span className="text-muted-foreground">Hardware:</span>
            <div className="font-medium">{selectedHardwareBrandName || 'Not selected'}</div>
          </div>
        </div>
        
        <Separator />
        
        <div className="text-sm">
          <span className="text-muted-foreground">Dimensions:</span>
          {isCorner ? (
            <div className="font-medium">
              Right: {rightSideWidth}mm × {height}mm × {depth}mm<br />
              Left: {leftSideWidth}mm × {height}mm × {depth}mm
            </div>
          ) : (
            <div className="font-medium">
              {width}mm × {height}mm × {depth}mm
            </div>
          )}
        </div>
      </div>

      {/* Quantity Selection */}
      <div className="space-y-3">
        <Label className="font-medium">Quantity</Label>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          
          <Input
            type="number"
            value={quantity}
            onChange={(e) => onQuantityChange(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 text-center"
            min="1"
          />
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => onQuantityChange(quantity + 1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Price Display */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">Total Price</span>
          {isLoading ? (
            <div className="animate-pulse bg-muted h-8 w-24 rounded"></div>
          ) : (
            <span className="text-2xl font-bold text-primary">
              ${(price * quantity).toFixed(2)}
            </span>
          )}
        </div>
        
        {quantity > 1 && (
          <div className="text-sm text-muted-foreground text-right">
            ${price.toFixed(2)} each × {quantity}
          </div>
        )}

        {/* Price Breakdown */}
        <Collapsible open={showPriceBreakdown} onOpenChange={setShowPriceBreakdown}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between h-auto p-2">
              <span className="text-sm">Price Breakdown</span>
              {showPriceBreakdown ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-2">
              <PriceBreakdown 
                cabinetType={cabinetType}
                width={width}
                height={height}
                depth={depth}
                doorStyleFinish={priceBreakdown?.doorStyleFinish}
                color={priceBreakdown?.color}
                cabinetParts={priceBreakdown?.cabinetParts || []}
                globalSettings={priceBreakdown?.globalSettings || []}
                hardwareCost={priceBreakdown?.hardwareCost || 0}
                totalPrice={price}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Validation Messages */}
      {!isValid && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          <p className="text-sm text-destructive font-medium">Please complete all selections:</p>
          <ul className="text-sm text-destructive mt-1 space-y-1">
            {!selectedDoorStyleName && <li>• Select a door style</li>}
            {!selectedColorName && <li>• Select a color</li>}
            {!selectedHardwareBrandName && <li>• Select hardware brand</li>}
          </ul>
        </div>
      )}

      {/* Add to Cart Button */}
      <Button
        onClick={onAddToCart}
        disabled={!isValid || isAddingToCart || isLoading}
        className="w-full h-12 text-base"
        size="lg"
      >
        <ShoppingCart className="h-5 w-5 mr-2" />
        {isAddingToCart ? "Adding to Cart..." : "Add to Cart"}
      </Button>
    </div>
  );
}