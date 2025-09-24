import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingCart, Trash2, Plus, Minus, X, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
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

interface CartDrawerProps {
  children: React.ReactNode;
}

export const CartDrawer = ({ children }: CartDrawerProps) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const { cart, updateQuantity, removeFromCart, getItemCount, isLoading, initializeCart } = useCart();
  const { convertCartToQuote, isLoading: isConverting } = useCartToQuote();
  const { isImpersonating, impersonatedCustomerEmail } = useAdminImpersonation();

  const handleNavigateToProduct = (item: any) => {
    const category = item.cabinet_type?.category || 'base';
    setIsOpen(false); // Close the cart drawer
    navigate(`/shop/kitchen/${category}?cabinet=${item.cabinet_type_id}`);
  };

  // Debug logging - remove or reduce in production
  console.log('CartDrawer render:', {
    hasCart: !!cart,
    itemsCount: cart?.items?.length || 0,
    isLoading,
    getItemCount: getItemCount()
  });

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
        
        // Initialize a new cart since the old one was converted to a quote
        await initializeCart();
        
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

    // Regular checkout flow for non-impersonation
    setIsOpen(false);
    navigate("/get-quote");
  };

  const handleViewCart = () => {
    setIsOpen(false);
    navigate("/cart");
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <div className="relative">
          {children}
          {getTotalItems() > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {getTotalItems()}
            </Badge>
          )}
        </div>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader className="space-y-2.5 pr-6">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping Cart
            <Badge variant="secondary">{getTotalItems()} items</Badge>
          </SheetTitle>
        </SheetHeader>

        {!cart?.items?.length ? (
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
              <div className="space-y-4 py-4">
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
                        ${item.total_price.toFixed(2)}
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
              
              <div className="space-y-2">
                <Button 
                  onClick={handleCheckout}
                  className="w-full"
                  size="lg"
                  disabled={isLoading || isConverting}
                >
                  {isImpersonating 
                    ? (isConverting ? "Creating Quote..." : "Create Quote for Customer")
                    : "Request Quote"
                  }
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleViewCart}
                  className="w-full"
                >
                  View Full Cart
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};