import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Minus, Plus, Trash2, Download, FileText } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { formatPrice, exportToCsv } from '@/lib/pricing';
import { generateCutlist, parseGlobalSettings } from '@/lib/pricing';

interface CartDrawerProps {
  children: React.ReactNode;
}

export function CartDrawer({ children }: CartDrawerProps) {
  const { cartItems, totalItems, totalAmount, removeFromCart, updateCartItemQuantity } = useCart();
  const [isExporting, setIsExporting] = useState(false);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
    } else {
      updateCartItemQuantity(itemId, newQuantity);
    }
  };

  const handleExportCsv = async () => {
    if (cartItems.length === 0) return;
    
    try {
      setIsExporting(true);
      
      // Create cutlists from cart items
      const cutlists = cartItems.map(item => {
        const configuration = {
          cabinetType: item.cabinet_type!,
          width: item.width_mm,
          height: item.height_mm,
          depth: item.depth_mm,
          quantity: item.quantity,
          finish: item.finish,
          color: item.color,
          doorStyle: item.door_style,
        };

        // Parse stored configuration
        const config = item.configuration ? JSON.parse(item.configuration) : {};
        const parts = config.parts || [];
        
        return {
          configuration,
          parts,
          carcassCost: config.carcassCost || 0,
          doorCost: config.doorCost || 0,
          hardwareCost: config.hardwareCost || 0,
          totalCost: item.total_price,
        };
      });

      const csvContent = exportToCsv(cutlists);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cabinet-cutlist-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Cart ({totalItems} items)
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Your cart is empty
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{item.cabinet_type?.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {item.width_mm} × {item.height_mm} × {item.depth_mm}mm
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Finish & Color */}
                        {(item.finish || item.color) && (
                          <div className="flex gap-2 flex-wrap">
                            {item.finish && (
                              <Badge variant="secondary">{item.finish.name}</Badge>
                            )}
                            {item.color && (
                              <Badge variant="outline">
                                {item.color.hex_code && (
                                  <div
                                    className="w-3 h-3 rounded mr-1"
                                    style={{ backgroundColor: item.color.hex_code }}
                                  />
                                )}
                                {item.color.name}
                              </Badge>
                            )}
                            {item.door_style && (
                              <Badge variant="secondary">{item.door_style.name}</Badge>
                            )}
                          </div>
                        )}

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatPrice(item.total_price)}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatPrice(item.unit_price)} each
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Separator />

              {/* Total */}
              <div className="space-y-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total (inc. GST):</span>
                  <span className="text-primary">{formatPrice(totalAmount)}</span>
                </div>

                {/* Export Options */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={handleExportCsv}
                    disabled={isExporting}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {isExporting ? 'Exporting...' : 'CSV'}
                  </Button>
                  <Button
                    variant="outline"
                    disabled
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    PDF (Soon)
                  </Button>
                </div>

                {/* Checkout */}
                <Button className="w-full" size="lg">
                  Get Quote
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}