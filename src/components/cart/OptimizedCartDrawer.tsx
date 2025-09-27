import React, { useState, useCallback, memo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuoteSelectionDialog } from "../cart/QuoteSelectionDialog";
import { CartSkeleton } from "@/components/ui/cart-skeleton";
import { useOptimizedCart } from "@/hooks/useOptimizedCart";
import { useAdminImpersonation } from "@/contexts/AdminImpersonationContext";
import { useNavigate } from "react-router-dom";
import { withPerformanceMonitoring } from "@/components/performance/PerformanceOptimizer";
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface OptimizedCartDrawerProps {
  children: React.ReactNode;
}

const OptimizedCartDrawer = memo(({ children }: OptimizedCartDrawerProps) => {
  const { cart, isLoading, getTotalItems, getTotalPrice, invalidateCache } = useOptimizedCart();
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const { isImpersonating } = useAdminImpersonation();
  const navigate = useNavigate();

  const itemCount = getTotalItems();
  
  const handleRequestQuote = useCallback(() => {
    if (isImpersonating) {
      // Admin creating quote for customer
      navigate('/admin/quotes/create', {
        state: { 
          cartItems: cart?.items,
          customerId: cart?.user_id 
        }
      });
    } else {
      // Regular user - show dialog
      setShowQuoteDialog(true);
    }
  }, [isImpersonating, cart, navigate]);

  const handleQuoteSelected = useCallback(async (quoteId: string | null, quoteName?: string) => {
    setIsConverting(true);
    try {
      // Implement quote conversion logic here
      console.log('Converting cart to quote:', { quoteId, quoteName });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Invalidate cache and refresh
      invalidateCache();
      setShowQuoteDialog(false);
    } catch (error) {
      console.error('Error converting to quote:', error);
    } finally {
      setIsConverting(false);
    }
  }, [invalidateCache]);

  const handleCheckout = useCallback(() => {
    navigate('/checkout');
  }, [navigate]);

  const handleViewCart = useCallback(() => {
    navigate('/cart');
  }, [navigate]);

  if (isLoading) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <div className="relative">
            {children}
            {itemCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {itemCount > 99 ? '99+' : itemCount}
              </Badge>
            )}
          </div>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Shopping Cart
            </SheetTitle>
          </SheetHeader>
          <CartSkeleton />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <div className="relative">
            {children}
            {itemCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-medium animate-pulse"
              >
                {itemCount > 99 ? '99+' : itemCount}
              </Badge>
            )}
          </div>
        </SheetTrigger>
        
        <SheetContent className="w-full sm:max-w-lg flex flex-col">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2 text-xl">
              <ShoppingCart className="h-6 w-6 text-primary" />
              Shopping Cart
              {itemCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {itemCount} item{itemCount !== 1 ? 's' : ''}
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>

          {!cart || cart.items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-8">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Your cart is empty</h3>
                <p className="text-sm text-muted-foreground">
                  Add some cabinets to get started
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-4 py-2">
                  {cart.items.map((item) => (
                    <OptimizedCartItem
                      key={item.id}
                      item={item}
                       onUpdateQuantity={async (quantity) => {
                        try {
                          const { error } = await supabase
                            .from('cart_items')
                            .update({ 
                              quantity,
                              total_price: quantity * item.unit_price
                            })
                            .eq('id', item.id);

                          if (error) throw error;
                          invalidateCache();
                        } catch (err) {
                          console.error('Error updating quantity:', err);
                        }
                      }}
                      onRemove={async () => {
                        try {
                          const { error } = await supabase
                            .from('cart_items')
                            .delete()
                            .eq('id', item.id);

                          if (error) throw error;
                          invalidateCache();
                        } catch (err) {
                          console.error('Error removing item:', err);
                        }
                      }}
                    />
                  ))}
                </div>
              </ScrollArea>

              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-base font-medium">Total:</span>
                  <span className="text-lg font-bold text-primary">
                    ${getTotalPrice().toLocaleString()}
                  </span>
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={handleCheckout}
                    className="w-full h-12 text-base font-medium"
                    size="lg"
                  >
                    Proceed to Checkout
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleCheckout}
                      className="flex-1"
                    >
                      Proceed to Checkout
                    </Button>
                    
                    <Button 
                      onClick={handleRequestQuote}
                      variant="outline"
                      className="flex-1"
                    >
                      Request Quote
                    </Button>
                  </div>
                  
                  <Button 
                    onClick={handleViewCart}
                    variant="outline"
                    className="w-full"
                  >
                    View Cart
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <QuoteSelectionDialog
        open={showQuoteDialog}
        onOpenChange={setShowQuoteDialog}
        onQuoteSelected={handleQuoteSelected}
        isLoading={isConverting}
        cartTotal={getTotalPrice()}
        itemCount={getTotalItems()}
        onAddToCart={() => {
          setShowQuoteDialog(false);
          handleCheckout();
        }}
      />
    </>
  );
});

// Optimized cart item component
interface OptimizedCartItemProps {
  item: any;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

const OptimizedCartItem = memo(({ item, onUpdateQuantity, onRemove }: OptimizedCartItemProps) => {
  const [quantity, setQuantity] = useState(item.quantity);

  const handleQuantityChange = useCallback((newQuantity: number) => {
    if (newQuantity > 0) {
      setQuantity(newQuantity);
      onUpdateQuantity(newQuantity);
    }
  }, [onUpdateQuantity]);

  return (
    <div className="flex gap-3 p-3 border rounded-lg bg-card">
      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
        {item.cabinet_type?.product_image_url ? (
          <img 
            src={item.cabinet_type.product_image_url} 
            alt={item.cabinet_type?.name || 'Cabinet'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <ShoppingCart className="w-6 h-6 text-muted-foreground" />
        )}
      </div>
      
      <div className="flex-1 min-w-0 space-y-1">
        <h4 className="font-medium text-sm leading-tight">
          {item.cabinet_type?.name || 'Cabinet'}
        </h4>
        
        <div className="text-xs text-muted-foreground space-y-0.5">
          {item.door_style && (
            <p>Door: {item.door_style.name}</p>
          )}
          {item.color && (
            <p>Color: {item.color.name}</p>
          )}
          <p>Size: {item.width_mm}×{item.height_mm}×{item.depth_mm}mm</p>
        </div>
        
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
              className="h-7 w-7 p-0"
            >
              <Minus className="h-3 w-3" />
            </Button>
            
            <span className="text-sm font-medium w-8 text-center">
              {quantity}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuantityChange(quantity + 1)}
              className="h-7 w-7 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              ${item.total_price.toLocaleString()}
            </span>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

OptimizedCartDrawer.displayName = 'OptimizedCartDrawer';
OptimizedCartItem.displayName = 'OptimizedCartItem';

export default withPerformanceMonitoring(OptimizedCartDrawer, 'OptimizedCartDrawer');