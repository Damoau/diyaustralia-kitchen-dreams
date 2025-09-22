import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCartSaveTracking } from "@/hooks/useCartSaveTracking";
import { ShoppingCart, Package, DollarSign } from "lucide-react";

interface QuoteItem {
  id: string;
  cabinet_type_id: string;
  quantity: number;
  width_mm: number;
  height_mm: number;
  depth_mm: number;
  unit_price: number;
  total_price: number;
  configuration?: any;
  door_style_id?: string;
  color_id?: string;
  finish_id?: string;
  notes?: string;
  cabinet_types?: {
    name: string;
  };
  door_styles?: {
    name: string;
  };
  colors?: {
    name: string;
  };
  finishes?: {
    name: string;
  };
}

interface QuoteToCartConverterProps {
  quoteId: string;
  quoteNumber: string;
  totalAmount: number;
  items: QuoteItem[];
  onSuccess?: () => void;
}

export const QuoteToCartConverter = ({ 
  quoteId, 
  quoteNumber, 
  totalAmount, 
  items,
  onSuccess 
}: QuoteToCartConverterProps) => {
  const [open, setOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const { toast } = useToast();
  const { markAsUnsaved, markAsSaving, markAsSaved, markAsError } = useCartSaveTracking();

  // Select all items by default
  useState(() => {
    setSelectedItems(items.map(item => item.id));
  });

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(items.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const getSelectedTotal = () => {
    return items
      .filter(item => selectedItems.includes(item.id))
      .reduce((sum, item) => sum + item.total_price, 0);
  };

  const handleAddToCart = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select at least one item to add to cart.",
        variant: "destructive"
      });
      return;
    }

    setIsConverting(true);
    markAsSaving(); // Track save status

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error("User not authenticated");
      }

      // Mark as unsaved when we start modifying the cart
      markAsUnsaved();

      // Get or create user's cart
      let { data: cart, error: cartError } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.user.id)
        .eq('status', 'active')
        .single();

      if (cartError && cartError.code === 'PGRST116') {
        // No active cart found, create one
        const { data: newCart, error: createError } = await supabase
          .from('carts')
          .insert({
            user_id: user.user.id,
            name: `Quote ${quoteNumber} Items`,
            source: 'quote_conversion',
            total_amount: 0
          })
          .select()
          .single();

        if (createError) throw createError;
        cart = newCart;
      } else if (cartError) {
        throw cartError;
      }

      // Convert selected quote items to cart items
      const selectedQuoteItems = items.filter(item => selectedItems.includes(item.id));
      
      const cartItems = selectedQuoteItems.map(item => ({
        cart_id: cart!.id,
        cabinet_type_id: item.cabinet_type_id,
        quantity: item.quantity,
        width_mm: item.width_mm,
        height_mm: item.height_mm,
        depth_mm: item.depth_mm,
        unit_price: item.unit_price,
        total_price: item.total_price,
        configuration: item.configuration,
        door_style_id: item.door_style_id,
        color_id: item.color_id,
        finish_id: item.finish_id,
        notes: `Added from Quote ${quoteNumber}`
      }));

      const { error: itemsError } = await supabase
        .from('cart_items')
        .insert(cartItems);

      if (itemsError) throw itemsError;

      // Update cart total
      const { error: updateError } = await supabase
        .from('carts')
        .update({ 
          total_amount: getSelectedTotal(),
          updated_at: new Date().toISOString()
        })
        .eq('id', cart!.id);

      if (updateError) throw updateError;

      // Mark as successfully saved
      markAsSaved();

      toast({
        title: "Items Added to Cart",
        description: `${selectedItems.length} items from Quote ${quoteNumber} have been added to your cart.`
      });

      setOpen(false);
      
      // Redirect to cart page to allow customer to review and checkout
      window.location.href = '/cart';
      
      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      console.error('Error adding to cart:', error);
      markAsError(); // Mark save as failed
      toast({
        title: "Error",
        description: "Failed to add items to cart. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="w-full">
        <ShoppingCart className="w-4 h-4 mr-2" />
        Add to Cart
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Quote Items to Cart</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Quote {quoteNumber}</p>
                <p className="text-sm text-muted-foreground">{items.length} items total</p>
              </div>
              <Badge variant="secondary">
                <DollarSign className="w-3 h-3 mr-1" />
                {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(totalAmount)}
              </Badge>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox
                    id="select-all"
                    checked={selectedItems.length === items.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <label htmlFor="select-all" className="font-medium cursor-pointer">
                    Select All Items
                  </label>
                </div>

                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={(checked) => handleSelectItem(item.id, !!checked)}
                        className="mt-1"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">
                            {item.cabinet_types?.name || 'Cabinet'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-2">
                          <div>Qty: {item.quantity}</div>
                          <div>Size: {item.width_mm}×{item.height_mm}×{item.depth_mm}mm</div>
                        </div>

                        {/* Configuration Details */}
                        <div className="space-y-1 text-sm">
                          {item.door_styles?.name && (
                            <div className="flex gap-2">
                              <span className="text-muted-foreground">Door Style:</span>
                              <span className="font-medium">{item.door_styles.name}</span>
                            </div>
                          )}
                          {item.colors?.name && (
                            <div className="flex gap-2">
                              <span className="text-muted-foreground">Color:</span>
                              <span className="font-medium">{item.colors.name}</span>
                            </div>
                          )}
                          {item.finishes?.name && (
                            <div className="flex gap-2">
                              <span className="text-muted-foreground">Finish:</span>
                              <span className="font-medium">{item.finishes.name}</span>
                            </div>
                          )}
                          {item.configuration && Object.keys(item.configuration).length > 0 && (
                            <div className="flex gap-2">
                              <span className="text-muted-foreground">Hardware:</span>
                              <span className="font-medium">
                                {item.configuration.hardware || 'Standard'}
                              </span>
                            </div>
                          )}
                          {item.notes && (
                            <div className="flex gap-2">
                              <span className="text-muted-foreground">Notes:</span>
                              <span className="font-medium">{item.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-semibold">
                          {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(item.total_price)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(item.unit_price)} ea.
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Selected Total:</span>
                  <span>
                    {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(getSelectedTotal())}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddToCart}
                disabled={isConverting || selectedItems.length === 0}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {isConverting ? 'Adding...' : `Add ${selectedItems.length} Item${selectedItems.length !== 1 ? 's' : ''} to Cart`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};