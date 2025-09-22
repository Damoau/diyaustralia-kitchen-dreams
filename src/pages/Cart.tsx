import { useState } from "react";
import { Helmet } from "react-helmet-async";
import DynamicHeader from "@/components/DynamicHeader";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Trash2, Plus, Minus, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ImpersonationLayout } from "@/components/layout/ImpersonationLayout";
import { useCart } from "@/hooks/useCart";
import { useCartToQuote } from "@/hooks/useCartToQuote";
import { useAdminImpersonation } from "@/contexts/AdminImpersonationContext";

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
  const { cart, updateQuantity, removeFromCart, getItemCount, isLoading } = useCart();
  const { convertCartToQuote, isLoading: isConverting } = useCartToQuote();
  const { isImpersonating, impersonatedCustomerEmail } = useAdminImpersonation();

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
    
    await updateQuantity(id, newQuantity);
  };

  const handleRemoveItem = async (id: string) => {
    await removeFromCart(id);
  };

  const getTotalPrice = () => {
    return cart?.total_amount || 0;
  };

  const getTotalItems = () => {
    return getItemCount();
  };

  const handleCheckout = async () => {
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
        // Navigate to admin quotes list to see the created quote
        navigate('/admin/quotes');
      }
      return;
    }

    // Add debugging to see what's happening
    console.log('Cart data for checkout:', cart);
    console.log('Cart items:', cart?.items);
    console.log('Cart total:', cart?.total_amount);

    // Regular checkout flow for non-impersonation
    if (cart?.id) {
      console.log('Navigating to checkout with cart ID:', cart.id);
      navigate("/checkout");
    } else {
      console.error('No cart ID available for checkout');
      toast.error("Cart not properly initialized. Please refresh and try again.");
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
        
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-6">
            <ShoppingCart className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Shopping Cart</h1>
            <Badge variant="secondary">{getTotalItems()} items</Badge>
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
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cart.items.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {item.cabinet_type?.product_image_url && (
                            <img 
                              src={item.cabinet_type.product_image_url} 
                              alt={item.cabinet_type.name}
                              className="w-20 h-20 object-cover rounded"
                            />
                          )}
                          
                          <div className="flex-1">
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
                        
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              disabled={isLoading}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              disabled={isLoading}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-semibold">
                              ${item.total_price.toFixed(2)}
                            </p>
                          </div>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-destructive hover:text-destructive"
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
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Subtotal ({getTotalItems()} items)</span>
                      <span>${getTotalPrice().toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span className="text-muted-foreground">Calculated at checkout</span>
                    </div>
                    
                    <hr />
                    
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>${getTotalPrice().toFixed(2)}</span>
                    </div>
                    
                    <Button 
                      onClick={handleCheckout}
                      className="w-full"
                      size="lg"
                      disabled={isLoading || isConverting}
                    >
                      {isImpersonating 
                        ? (isConverting ? "Creating Quote..." : "Create Quote for Customer")
                        : "Proceed to Checkout"
                      }
                    </Button>
                    
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
    </ImpersonationLayout>
  );
};

export default Cart;