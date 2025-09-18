import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Minus, Plus, Trash2, Download, FileText } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
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
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-gradient-to-br from-background to-muted/20">
        <SheetHeader className="pb-6 border-b border-border/50">
          <SheetTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div className="flex flex-col items-start">
              <span>Your Cart</span>
              <span className="text-sm font-normal text-muted-foreground">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </span>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {cartItems.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
                <ShoppingCart className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-medium text-muted-foreground">Your cart is empty</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Add some cabinets to get started</p>
              </div>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-4">
                {cartItems.map((item, index) => (
                  <Card key={item.id} className="group hover:shadow-md transition-all duration-200 border-border/50 bg-card/50 backdrop-blur-sm animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                    <CardContent className="p-5">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {item.cabinet_type?.name}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div className="px-2 py-1 bg-muted/50 rounded text-xs font-mono">
                                {item.width_mm} × {item.height_mm} × {item.depth_mm}mm
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item.id)}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Finish & Color */}
                        {(item.finish || item.color || item.door_style) && (
                          <div className="flex gap-2 flex-wrap">
                            {item.finish && (
                              <Badge variant="secondary" className="bg-secondary/50 hover:bg-secondary/80 transition-colors">
                                {item.finish.name}
                              </Badge>
                            )}
                            {item.color && (
                              <Badge variant="outline" className="border-border/50 bg-background/50">
                                {item.color.hex_code && (
                                  <div
                                    className="w-3 h-3 rounded-full mr-2 border border-border/30"
                                    style={{ backgroundColor: item.color.hex_code }}
                                  />
                                )}
                                {item.color.name}
                              </Badge>
                            )}
                            {item.door_style && (
                              <Badge variant="secondary" className="bg-accent/20 text-accent-foreground hover:bg-accent/30 transition-colors">
                                {item.door_style.name}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between pt-3 border-t border-border/30">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground font-medium">Qty:</span>
                            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 hover:bg-background hover:scale-110 transition-all"
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-sm font-semibold bg-background rounded px-2 py-1">
                                {item.quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 hover:bg-background hover:scale-110 transition-all"
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="text-lg font-bold text-primary">{formatPrice(item.total_price)}</div>
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

              <div className="border-t border-gradient-to-r from-transparent via-border to-transparent my-6" />

              {/* Total Section */}
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-6 border border-border/50">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <span className="text-lg font-semibold text-muted-foreground">Total (inc. GST)</span>
                      <p className="text-xs text-muted-foreground/70 mt-1">{totalItems} items</p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        {formatPrice(totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Export Options */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Export Options</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={handleExportCsv}
                      disabled={isExporting}
                      className="flex items-center gap-2 hover:bg-secondary/20 transition-all hover:scale-[1.02]"
                    >
                      <Download className="h-4 w-4" />
                      {isExporting ? 'Exporting...' : 'Export CSV'}
                    </Button>
                    <Button
                      variant="outline"
                      disabled
                      className="flex items-center gap-2 opacity-60"
                    >
                      <FileText className="h-4 w-4" />
                      PDF (Soon)
                    </Button>
                  </div>
                </div>

                {/* Checkout */}
                <Button className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-secondary hover:scale-[1.02] transition-all shadow-lg" size="lg">
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