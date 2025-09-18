import { useCart } from '@/contexts/CartContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, ShoppingBag } from 'lucide-react';
import { formatPrice } from '@/lib/pricing';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ProductCartItem } from './ProductCartItem';

interface EnhancedCartDrawerProps {
  children?: React.ReactNode;
}

export const EnhancedCartDrawer = ({ children }: EnhancedCartDrawerProps) => {
  const { cartItems, totalAmount, totalItems, removeFromCart, updateCartItemQuantity } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
    } else {
      updateCartItemQuantity(itemId, newQuantity);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {children || (
          <Button variant="outline" size="icon" className="relative">
            <ShoppingCart className="h-4 w-4" />
            {totalItems > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {totalItems}
              </Badge>
            )}
          </Button>
        )}
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Shopping Cart ({totalItems} items)
          </SheetTitle>
        </SheetHeader>

        {cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground mb-6">Add some products to get started!</p>
            <Button onClick={() => setIsOpen(false)}>
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {cartItems.map((item) => (
                <ProductCartItem
                  key={item.id}
                  item={item}
                  onQuantityChange={handleQuantityChange}
                  onRemove={removeFromCart}
                />
              ))}
            </div>

            {/* Cart Footer */}
            <div className="border-t pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-lg font-bold text-primary">
                  {formatPrice(totalAmount)}
                </span>
              </div>
              
              <Separator />
              
              <div className="space-y-3 pt-4">
                <Button 
                  asChild 
                  size="lg" 
                  className="w-full"
                  onClick={() => setIsOpen(false)}
                >
                  <Link to="/cart">
                    View Full Cart
                  </Link>
                </Button>
                
                <Button 
                  asChild 
                  size="lg" 
                  className="w-full"
                  onClick={() => setIsOpen(false)}
                >
                  <Link to="/checkout">
                    Proceed to Checkout
                  </Link>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full"
                  onClick={() => setIsOpen(false)}
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};