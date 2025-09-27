import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingCart, Trash2, Plus, Minus, X, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCartOptimized } from "@/hooks/useCartOptimized";
import { CartLoadingSkeleton } from "@/components/ui/cart-loading-skeleton";
import { useCartToQuote } from "@/hooks/useCartToQuote";
import { useAdminImpersonation } from "@/contexts/AdminImpersonationContext";
import { useAuth } from "@/hooks/useAuth";
import { QuoteSelectionDialog } from "@/components/cart/QuoteSelectionDialog";
import { supabase } from "@/integrations/supabase/client";

interface CartItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
}

interface CartDrawerProps {
  children: React.ReactNode;
}

export const CartDrawer = ({ children }: CartDrawerProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cart,
    isLoading,
    error,
    getTotalItems,
    getTotalPrice,
    invalidateCache,
    updateItemOptimistically,
    removeItemOptimistically
  } = useCartOptimized();
  
  // Defensive checks to prevent calling undefined functions
  const safeGetTotalItems = typeof getTotalItems === 'function' ? getTotalItems : () => 0;
  const safeGetTotalPrice = typeof getTotalPrice === 'function' ? getTotalPrice : () => 0;
  
  const { isImpersonating, impersonatedCustomerEmail } = useAdminImpersonation();
  
  const [isOpen, setIsOpen] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [isConverting, setIsConverting] = useState(false);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const { convertCartToQuote, isLoading: isConvertLoading } = useCartToQuote();

  // No need to initialize cart - optimized cart handles this

  const handleRemoveItem = async (itemId: string) => {
    try {
      // Optimistic update first
      removeItemOptimistically(itemId);
      
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        // Revert optimistic update on error
        invalidateCache();
        throw error;
      }
      
      toast.success('Item removed from cart');
    } catch (err) {
      console.error('Error removing item:', err);
      toast.error('Failed to remove item');
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await handleRemoveItem(itemId);
      return;
    }

    try {
      // Optimistic update first
      updateItemOptimistically(itemId, newQuantity);

      const { error } = await supabase
        .from('cart_items')
        .update({ 
          quantity: newQuantity,
          total_price: newQuantity * (cart?.items?.find(item => item.id === itemId)?.unit_price || 0)
        })
        .eq('id', itemId);

      if (error) {
        // Revert optimistic update on error
        invalidateCache();
        throw error;
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
      toast.error('Failed to update item');
    }
  };

  const toggleNotes = (itemId: string) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedNotes(newExpanded);
  };

  const handleNavigateToProduct = (item: any) => {
    console.log('Navigate to product:', item);
    // Implementation for navigating to product page
  };

  const handleRequestQuote = async () => {
    if (!cart?.items?.length) {
      toast.error("Your cart is empty");
      return;
    }

    // If in impersonation mode, convert cart to quote directly
    if (isImpersonating && impersonatedCustomerEmail && cart?.id) {
      const result = await convertCartToQuote(
        cart.id,
        impersonatedCustomerEmail,
        `Quote created by admin for ${impersonatedCustomerEmail}`
      );
      
      if (result.success) {
        toast.success(`Quote ${result.quoteNumber} created for customer`);
        
        // Refresh the cart after quote conversion
        invalidateCache();
        
        // Dispatch custom event to notify quotes page to refresh
        window.dispatchEvent(new CustomEvent('quoteCreated', {
          detail: { quoteId: result.quoteId, quoteNumber: result.quoteNumber }
        }));
        
        // Close drawer and navigate to quotes page
        setIsOpen(false);
        setTimeout(() => {
          navigate('/admin/sales/quotes');
        }, 500);
      }
      return;
    }

    // For regular users, show the quote selection dialog
    setShowQuoteDialog(true);
  };

  const handleQuoteSelected = async (quoteId: string | null, quoteName?: string, replaceItems?: boolean) => {
    if (!cart?.id) return;
    
    setIsConverting(true);
    setShowQuoteDialog(false);
    
    try {
      const result = await convertCartToQuote(
        cart.id, 
        user?.email, 
        undefined, // notes
        quoteId, // existing quote ID (null for new quote)
        quoteName, // name for new quote
        replaceItems // replace all items in existing quote
      );
      
      if (result.success) {
        const message = result.isNewQuote 
          ? `Quote ${result.quoteNumber} has been created and will be reviewed by our team`
          : (replaceItems 
            ? `Quote ${result.quoteNumber} updated with cart items`
            : `Items added to quote ${result.quoteNumber}`);
          
        toast.success(message);
        
        // Refresh the cart after quote conversion
        invalidateCache();
        
        // Close drawer and navigate to customer portal quotes
        setIsOpen(false);
        setTimeout(() => {
          navigate('/portal/quotes');
        }, 500);
      }
    } catch (error) {
      console.error('Error in quote conversion:', error);
    } finally {
      setIsConverting(false);
    }
  };

  const handleCheckout = () => {
    if (!cart?.items?.length) {
      toast.error("Your cart is empty");
      return;
    }
    setIsOpen(false);
    navigate("/checkout");
  };

  const handleViewCart = () => {
    setIsOpen(false);
    navigate("/cart");
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <div className="relative">
            {children}
            {safeGetTotalItems() > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {safeGetTotalItems()}
              </Badge>
            )}
          </div>
        </SheetTrigger>
        
        <SheetContent side="right" className="w-full sm:max-w-lg p-0">
          <div className="flex flex-col h-full p-6">
          <SheetHeader className="space-y-2.5 pr-6">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Shopping Cart
              <Badge variant="secondary">{safeGetTotalItems()} items</Badge>
            </SheetTitle>
          </SheetHeader>

          {isLoading ? (
            <CartLoadingSkeleton />
          ) : !cart?.items?.length ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground mb-6">
                Browse our kitchen cabinets and hardware to get started
              </p>
              <Button onClick={() => { setIsOpen(false); navigate("/shop"); }}>
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <ScrollArea className="flex-1 pr-6">
                <div className="space-y-4">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex items-start space-x-4 py-4 border-b last:border-0">
                      {item.cabinet_type?.product_image_url && (
                        <img 
                          src={item.cabinet_type.product_image_url} 
                          alt={item.cabinet_type.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <button 
                          onClick={() => handleNavigateToProduct(item)}
                          className="font-medium truncate hover:text-primary cursor-pointer text-left"
                        >
                          {item.cabinet_type?.name || 'Cabinet'}
                        </button>
                        <p className="text-sm text-muted-foreground">{item.cabinet_type?.category}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.width_mm} × {item.height_mm} × {item.depth_mm}mm
                        </p>
                        
                        {/* Style selections */}
                        <div className="text-xs text-muted-foreground mt-1">
                          {item.door_style?.name && (
                            <span className="block">Door: {item.door_style.name}</span>
                          )}
                          {item.color?.name && (
                            <span className="block">Color: {item.color.name}</span>
                          )}
                          {item.finish?.name && (
                            <span className="block">Finish: {item.finish.name}</span>
                          )}
                          {item.configuration?.assembly?.enabled && (
                            <span className="block text-primary">
                              Assembly: {item.configuration.assembly.type === 'carcass_only' 
                                ? 'Carcass Only' 
                                : 'Complete Assembly'
                              } (+${item.configuration.assembly.price?.toFixed(2)})
                            </span>
                          )}
                        </div>
                        
                        {/* Check for notes in multiple places */}
                        {(item.notes || item.configuration?.notes) && (
                          <div className="mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleNotes(item.id)}
                              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                            >
                              Notes
                              <ChevronDown 
                                className={`h-3 w-3 transition-transform ${
                                  expandedNotes.has(item.id) ? 'rotate-180' : ''
                                }`} 
                              />
                            </Button>
                            {expandedNotes.has(item.id) && (
                              <div className="text-xs text-muted-foreground mt-1 p-2 bg-muted/50 rounded">
                                <p className="whitespace-pre-wrap break-words">
                                  {item.notes || item.configuration?.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <p className="text-sm font-medium mt-1">${item.unit_price.toFixed(2)} each</p>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveItem(item.id)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          disabled={isLoading}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="h-6 w-6 p-0"
                            disabled={isLoading}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="h-6 w-6 p-0"
                            disabled={isLoading}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <p className="text-sm font-semibold">
                          ${(item.quantity * item.unit_price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${getTotalPrice().toFixed(2)}</span>
                </div>
                
                {/* Modern 20% Deposit Banner */}
                {getTotalPrice() > 0 && (
                  <div className="flex justify-center">
                    <div className="bg-gradient-to-r from-primary to-blue-dark text-primary-foreground rounded-xl px-6 py-3 shadow-lg border border-primary/20 backdrop-blur-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium opacity-90">20% Deposit</span>
                          <span className="text-lg font-bold">
                            ${(getTotalPrice() * 0.2).toFixed(2)}
                          </span>
                        </div>
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold">20%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  {isImpersonating ? (
                    <Button 
                      onClick={handleRequestQuote}
                      className="w-full"
                      size="lg"
                      disabled={isLoading || isConverting}
                    >
                      {isConverting ? "Creating Quote..." : "Create Quote for Customer"}
                    </Button>
                  ) : (
                    <>
                      <Button 
                        onClick={handleCheckout}
                        className="w-full h-12 text-base font-semibold"
                        size="lg"
                        disabled={isLoading}
                      >
                        Proceed to Checkout
                      </Button>
                  
                      <Button 
                        onClick={handleRequestQuote}
                        variant="outline"
                        className="w-full h-12 text-base bg-white border-2 border-primary/20 hover:bg-primary/5 hover:border-primary/40 text-foreground"
                        size="lg"
                        disabled={isLoading || isConverting}
                      >
                        {isConverting ? "Saving as Quote..." : "Save as Quote"}
                      </Button>
                    </>
                  )}
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={handleViewCart}
                  className="w-full"
                >
                  View Full Cart
                </Button>
              </div>
            </div>
          )}
          </div>
        </SheetContent>
      </Sheet>

      <QuoteSelectionDialog
        open={showQuoteDialog}
        onOpenChange={setShowQuoteDialog}
        onQuoteSelected={handleQuoteSelected}
        isLoading={isConverting}
        cartTotal={safeGetTotalPrice()}
        itemCount={safeGetTotalItems()}
        onAddToCart={() => {
          setShowQuoteDialog(false);
          handleCheckout();
        }}
      />
    </>
  );
};