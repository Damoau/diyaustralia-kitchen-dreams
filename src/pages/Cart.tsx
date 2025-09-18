import React from 'react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, ArrowLeft, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductCartItem } from '@/components/cart/ProductCartItem';
import { CartSummary } from '@/components/cart/CartSummary';
import { formatPrice } from '@/lib/pricing';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Cart() {
  const { cartItems, totalAmount, totalItems, removeFromCart, updateCartItemQuantity } = useCart();

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
    } else {
      updateCartItemQuantity(itemId, newQuantity);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 pt-28">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ShoppingCart className="h-8 w-8" />
              Shopping Cart
            </h1>
            <Button asChild variant="outline">
              <Link to="/products" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Continue Shopping
              </Link>
            </Button>
          </div>
          
          {totalItems > 0 && (
            <p className="text-muted-foreground">
              {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
            </p>
          )}
        </div>

        {cartItems.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <ShoppingCart className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
                <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
                <p className="text-muted-foreground mb-6">
                  Browse our cabinet collection to get started on your kitchen renovation.
                </p>
                <Button asChild size="lg">
                  <Link to="/products">
                    Browse Cabinets
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Cart Items ({cartItems.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartItems.map((item) => (
                    <ProductCartItem
                      key={item.id}
                      item={item}
                      onQuantityChange={handleQuantityChange}
                      onRemove={removeFromCart}
                    />
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Cart Summary & Checkout */}
            <div className="space-y-6">
              <CartSummary 
                cartItems={cartItems}
                totalAmount={totalAmount}
                totalItems={totalItems}
              />

              {/* Checkout Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Checkout
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total:</span>
                      <span className="text-primary">{formatPrice(totalAmount)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Including GST and all applicable charges
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <Button asChild size="lg" className="w-full">
                      <Link to="/checkout">
                        Proceed to Checkout
                      </Link>
                    </Button>
                    
                    <Button asChild variant="outline" size="lg" className="w-full">
                      <Link to="/get-quote">
                        Request Custom Quote
                      </Link>
                    </Button>
                  </div>
                  
                  <div className="text-xs text-muted-foreground text-center">
                    <p>Free consultation available</p>
                    <p>Professional installation services offered</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}