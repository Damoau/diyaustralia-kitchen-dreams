import { useState } from "react";
import { Helmet } from "react-helmet-async";
import DynamicHeader from "@/components/DynamicHeader";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Trash2, Plus, Minus, ChevronDown, BookmarkIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ImpersonationLayout } from "@/components/layout/ImpersonationLayout";
import { useCartMigration } from "@/hooks/useCartMigration";
import { useCartToQuote } from "@/hooks/useCartToQuote";
import { useAdminImpersonation } from "@/contexts/AdminImpersonationContext";
import { useAuth } from "@/hooks/useAuth";
import { QuoteSelectionDialog } from "@/components/cart/QuoteSelectionDialog";

interface CartItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  image?: string;
}

const Cart = () => {
  const navigate = useNavigate();
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const { cart, isLoading, error, getTotalItems, getTotalPrice, invalidateCache, refreshCart, updateItemOptimistically, removeItemOptimistically } = useCartMigration() || {};
  
  // Defensive checks to prevent calling undefined functions
  const safeGetTotalItems = typeof getTotalItems === 'function' ? getTotalItems : () => 0;
  const safeGetTotalPrice = typeof getTotalPrice === 'function' ? getTotalPrice : () => 0;
  const { convertCartToQuote, isLoading: isConverting } = useCartToQuote();
  const { isImpersonating, impersonatedCustomerEmail } = useAdminImpersonation();
  const { user } = useAuth();

  const toggleNotes = (itemId: string) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedNotes(newExpanded);
  };

  const handleUpdateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity === 0) {
      await handleRemoveItem(id);
      return;
    }
    
    try {
      // Optimistic update first
      updateItemOptimistically(id, newQuantity);
      
      const { data, error } = await supabase
        .from('cart_items')
        .update({ 
          quantity: newQuantity,
          total_price: newQuantity * (cart?.items?.find(item => item.id === id)?.unit_price || 0)
        })
        .eq('id', id);

      if (error) {
        // Revert optimistic update on error
        invalidateCache();
        throw error;
      }
      
      toast.success('Item updated');
    } catch (err) {
      console.error('Error updating quantity:', err);
      toast.error('Failed to update item');
    }
  };

  const handleRemoveItem = async (id: string) => {
    try {
      // Optimistic update first
      removeItemOptimistically(id);
      
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', id);

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

  const handleRequestQuote = async () => {
    console.log('🚀 handleRequestQuote called', { 
      cartItems: cart?.items?.length, 
      isImpersonating, 
      impersonatedCustomerEmail 
    });
    
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
        // Refresh cart data
        invalidateCache();
        // Navigate to admin quotes list to see the created quote
        navigate('/admin/sales/quotes');
      }
      return;
    }

    // Regular user - show quote selection dialog
    console.log('🔓 Opening quote selection dialog for regular user');
    setShowQuoteDialog(true);
  };

  const handleQuoteSelected = async (existingQuoteId: string | null, quoteName?: string, replaceItems?: boolean) => {
    setShowQuoteDialog(false);
    
    if (!cart?.id || !user) return;

    const result = await convertCartToQuote(
      cart.id,
      user.email,
      `Quote created from cart items`,
      existingQuoteId,
      quoteName,
      replaceItems
    );
    
    if (result.success) {
      const actionText = existingQuoteId 
        ? (replaceItems 
          ? `Quote ${result.quoteNumber} updated with cart items`
          : `Items added to quote ${result.quoteNumber}`)
        : `Quote ${result.quoteNumber} has been created and will be reviewed by our team`;
      
      toast.success(actionText);
      
      // Refresh the cart after quote conversion
      invalidateCache();
      
      // Navigate to customer portal quotes
      navigate('/portal/quotes');
    }
  };

  const handleCheckout = () => {
    if (!cart?.items?.length) {
      toast.error("Your cart is empty");
      return;
    }
    
    navigate("/checkout");
  };

  const handleSaveCart = async () => {
    if (!cart?.items?.length) {
      toast.error("Cannot save an empty cart");
      return;
    }
    
    try {
      const { error } = await supabase
        .from('carts')
        .update({
          status: 'saved',
          abandon_reason: 'Customer saved cart for later review',
          abandoned_at: new Date().toISOString()
        })
        .eq('id', cart?.id);

      if (error) throw error;
      
      toast.success('Cart saved successfully');
      invalidateCache();
    } catch (err) {
      console.error('Error saving cart:', err);
      toast.error('Failed to save cart');
    }
  };

  return (
    <ImpersonationLayout>
      <Helmet>
        <title>Shopping Cart - DIY Kitchens</title>
        <meta name="description" content="Review your selected kitchen cabinets and hardware before requesting a quote." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <DynamicHeader />
        
        <main className="container mx-auto px-4 py-6 md:py-8 mobile-safe-bottom">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-6">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 md:h-6 md:w-6" />
              <h1 className="text-2xl md:text-3xl font-bold">Shopping Cart</h1>
            </div>
            <Badge variant="secondary" className="self-start sm:self-center">{safeGetTotalItems()} items</Badge>
          </div>

          {!cart?.items?.length ? (
            <Card className="text-center py-12">
              <CardContent>
                <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
                <p className="text-muted-foreground mb-6">
                  Browse our kitchen cabinets and hardware to get started
                </p>
                <Button onClick={() => navigate("/shop")}>
                  Continue Shopping
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-3 md:space-y-4">
                {cart.items.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
                        <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
                          {item.cabinet_type?.product_image_url && (
                            <img 
                              src={item.cabinet_type.product_image_url} 
                              alt={item.cabinet_type.name}
                              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded flex-shrink-0"
                            />
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold">{item.cabinet_type?.name || 'Cabinet'}</h3>
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
                            
                            <p className="font-medium mt-1">${item.unit_price.toFixed(2)} each</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mt-3 sm:mt-0">
                          <div className="flex items-center justify-between sm:justify-start gap-2">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                disabled={isLoading}
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                disabled={isLoading}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <div className="text-right sm:ml-4">
                              <p className="font-semibold text-sm">
                                ${item.total_price.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-destructive hover:text-destructive self-end sm:self-center"
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Order Summary */}
              <div>
                <Card className="sticky top-4 mt-6 lg:mt-0">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Subtotal ({safeGetTotalItems()} items)</span>
                      <span>${safeGetTotalPrice().toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span className="text-muted-foreground">Calculated at checkout</span>
                    </div>
                    
                    <hr />
                    
                     <div className="flex justify-between font-semibold text-lg">
                       <span>Total</span>
                       <span>${safeGetTotalPrice().toFixed(2)}</span>
                     </div>
                     
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
                           onClick={handleRequestQuote}
                           className="w-full"
                           size="lg"
                           disabled={isLoading || isConverting}
                         >
                           {isConverting ? "Saving as Quote..." : "Save as Quote"}
                         </Button>
                         
                         <Button 
                           variant="outline" 
                           onClick={handleCheckout}
                           className="w-full"
                           disabled={isLoading}
                         >
                           Proceed to Checkout
                         </Button>
                       </>
                     )}
                    
                    {!isImpersonating && (
                      <Button 
                        variant="outline" 
                        onClick={handleSaveCart}
                        className="w-full"
                        disabled={isLoading}
                      >
                        <BookmarkIcon className="mr-2 h-4 w-4" />
                        Save Cart for Later
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline" 
                      onClick={() => navigate("/shop")}
                      className="w-full"
                    >
                      Continue Shopping
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
        
        <Footer />
      </div>

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
    </ImpersonationLayout>
  );
};

export default Cart;