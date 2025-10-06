import React, { useState, useCallback, memo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuoteSelectionDialog } from "../cart/QuoteSelectionDialog";
import { CartSkeleton } from "@/components/ui/cart-skeleton";
import { useCartMigration } from "@/hooks/useCartMigration";
import { useCartToQuote } from "@/hooks/useCartToQuote";
import { useAdminImpersonation } from "@/contexts/AdminImpersonationContext";
import { useNavigate } from "react-router-dom";
import { withPerformanceMonitoring } from "@/components/performance/PerformanceOptimizer";
import { ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCartConsolidation } from "@/hooks/useCartConsolidation";
import { CartConsolidationButton } from "./CartConsolidationButton";
import { formatCurrency } from "@/lib/formatPrice";
import { toast } from "sonner";
import { EnhancedCartItem } from "./EnhancedCartItem";

interface OptimizedCartDrawerProps {
  children: React.ReactNode;
}

const OptimizedCartDrawer = memo(({ children }: OptimizedCartDrawerProps) => {
  const { cart, isLoading, getTotalItems, getTotalPrice, invalidateCache, updateItemOptimistically, removeItemOptimistically } = useCartMigration();
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const { isImpersonating } = useAdminImpersonation();
  const { convertCartToQuote } = useCartToQuote();
  const navigate = useNavigate();

  const itemCount = getTotalItems();
  
  const handleNavigateToProduct = (item: any) => {
    console.log('Navigate to product:', item);
    
    // Extract room and category information from the item
    if (item.cabinet_type?.room_category && item.cabinet_type?.unified_categories) {
      const roomCategory = item.cabinet_type.room_category;
      const category = item.cabinet_type.unified_categories;
      
      // Navigate to the category page with cabinet parameter to auto-open popup
      navigate(`/shop/${roomCategory.name}/${category.name}?cabinet=${item.cabinet_type.id}`);
    } else {
      // Fallback navigation to shop if we can't determine the exact path
      navigate('/shop');
      toast.error('Could not find product page');
    }
  };
  
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

  const handleQuoteSelected = useCallback(async (quoteId: string | null, quoteName?: string, replaceItems?: boolean) => {
    if (!cart?.id) {
      console.error('No cart ID available for quote conversion');
      return;
    }

    setIsConverting(true);
    try {
      console.log('Converting cart to quote:', { cartId: cart.id, quoteId, quoteName, replaceItems });
      
      const result = await convertCartToQuote(
        cart.id,
        undefined, // customer email - will use user's email
        'Cart converted to quote',
        quoteId || undefined,
        quoteName,
        replaceItems
      );
      
      if (result.success) {
        // Invalidate cache and refresh - cart is now cleared by edge function
        invalidateCache();
        setShowQuoteDialog(false);
        
        // Force a complete refresh to ensure UI shows empty cart
        setTimeout(() => {
          invalidateCache();
          window.dispatchEvent(new CustomEvent('cart-updated'));
        }, 100);
        
        // Navigate to the quote if it was successful
        if (result.quoteId && result.isNewQuote) {
          setTimeout(() => {
            window.open(`/portal/quotes/${result.quoteId}`, '_blank');
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error converting to quote:', error);
    } finally {
      setIsConverting(false);
    }
  }, [cart?.id, convertCartToQuote, invalidateCache]);

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
                    <EnhancedCartItem
                      key={item.id}
                      item={item}
                      onNavigateToProduct={handleNavigateToProduct}
                      onUpdateQuantity={async (quantity) => {
                        try {
                          // Optimistic update first
                          updateItemOptimistically(item.id, quantity);
                          
                          const { error } = await supabase
                            .from('cart_items')
                            .update({ 
                              quantity,
                              total_price: quantity * item.unit_price
                            })
                            .eq('id', item.id);

                          if (error) {
                            // Revert on error
                            invalidateCache();
                            throw error;
                          }
                        } catch (err) {
                          console.error('Error updating quantity:', err);
                        }
                      }}
                      onRemove={async () => {
                        try {
                          // Optimistic update first
                          removeItemOptimistically(item.id);
                          
                          const { error } = await supabase
                            .from('cart_items')
                            .delete()
                            .eq('id', item.id);

                          if (error) {
                            // Revert on error
                            invalidateCache();
                            throw error;
                          }
                        } catch (err) {
                          console.error('Error removing item:', err);
                        }
                      }}
                    />
                  ))}
                </div>
              </ScrollArea>

              <div className="border-t pt-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal (ex GST):</span>
                    <span>{formatCurrency(getTotalPrice() / 1.1)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>GST (10%):</span>
                    <span>{formatCurrency((getTotalPrice() / 1.1) * 0.1)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center font-semibold text-lg pt-2 border-t">
                    <span>Total (inc GST):</span>
                    <span className="text-primary">
                      {formatCurrency(getTotalPrice())}
                    </span>
                  </div>
                </div>

                {/* Modern 20% Deposit Banner */}
                {getTotalPrice() > 0 && (
                  <div className="w-full max-w-md mx-auto">
                    <div className="bg-gradient-to-r from-primary to-blue-dark text-primary-foreground rounded-xl px-6 py-3 shadow-lg border border-primary/20 backdrop-blur-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium opacity-90">20% deposit to get all cabinets started</span>
                          <span className="text-lg font-bold">
                            {formatCurrency(getTotalPrice() * 0.2)}
                          </span>
                        </div>
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold">20%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {getTotalPrice() > 0 && (
                    <>
                      <Button 
                        onClick={handleCheckout}
                        className="w-full h-12 text-base font-medium"
                        size="lg"
                      >
                        Proceed to Checkout
                      </Button>
                      
                      <Button 
                        onClick={handleCheckout}
                        variant="secondary"
                        className="w-full h-12 text-base"
                        size="lg"
                      >
                        Proceed to Checkout with a 20% Deposit
                      </Button>
                      
                      {isImpersonating ? (
                        <Button 
                          onClick={handleRequestQuote}
                          variant="outline"
                          className="w-full h-12 text-base"
                          size="lg"
                        >
                          Create Quote for Customer
                        </Button>
                      ) : (
                      <Button 
                        onClick={handleRequestQuote}
                        variant="outline"
                        className="w-full h-12 text-base bg-white border-2 border-primary/20 hover:bg-primary/5 hover:border-primary/40 text-foreground"
                        size="lg"
                      >
                        Save Cart as Quote for later
                      </Button>
                      )}
                      
                      <Button 
                        onClick={handleViewCart}
                        variant="outline"
                        className="w-full"
                      >
                        View Cart
                      </Button>
                    </>
                  )}
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

OptimizedCartDrawer.displayName = 'OptimizedCartDrawer';

export default withPerformanceMonitoring(OptimizedCartDrawer, 'OptimizedCartDrawer');