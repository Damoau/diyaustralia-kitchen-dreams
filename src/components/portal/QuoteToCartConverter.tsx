import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { LoadingBox } from "@/components/ui/loading-box";
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
  items: QuoteItem[];
  buttonText?: string;
  onSuccess?: () => void;
}

export const QuoteToCartConverter = ({ 
  quoteId, 
  items,
  buttonText = "Add to Cart",
  onSuccess 
}: QuoteToCartConverterProps) => {
  const [open, setOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const { toast } = useToast();
  const { markAsUnsaved, markAsSaving, markAsSaved, markAsError } = useCartSaveTracking();

  // Select all items by default
  useEffect(() => {
    setSelectedItems(items.map(item => item.id));
  }, [items]);

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
    markAsSaving();

    try {
      // Use optimized edge function for much faster processing
      const { data, error } = await supabase.functions.invoke('quote-to-cart-fast', {
        body: { 
          quote_id: quoteId,
          selected_item_ids: selectedItems 
        }
      });

      if (error) throw error;

      markAsSaved();

      toast({
        title: "Items Added to Cart! 🎉",
        description: `${selectedItems.length} items packed and ready. Redirecting to cart...`
      });

      setOpen(false);
      
      // Force a clean redirect to cart page
      setTimeout(() => {
        window.location.href = '/cart';
      }, 500);
      
      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      console.error('Error adding to cart:', error);
      markAsError();
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
      <Button 
        variant="outline" 
        size="lg" 
        onClick={() => setOpen(true)}
        className="flex-1"
      >
        <ShoppingCart className="w-4 h-4 mr-2" />
        {buttonText}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Quote Items to Cart</DialogTitle>
          </DialogHeader>

          {isConverting ? (
            <div className="flex items-center justify-center py-12">
              <LoadingBox message="Packing your items into cart..." />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Quote Items</p>
                  <p className="text-sm text-muted-foreground">{items.length} items total</p>
                </div>
                <Badge variant="secondary">
                  <DollarSign className="w-3 h-3 mr-1" />
                  {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(getSelectedTotal())}
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
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {isConverting ? 'Packing...' : `Pack ${selectedItems.length} Item${selectedItems.length !== 1 ? 's' : ''} in Cart`}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};