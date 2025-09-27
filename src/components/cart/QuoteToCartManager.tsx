import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ShoppingCart, Plus, RefreshCw, Archive } from 'lucide-react';
import { useEnhancedCartManager } from '@/hooks/useEnhancedCartManager';
import { useCartToQuote } from '@/hooks/useCartToQuote';
import { CartStatusIndicator } from './CartStatusIndicator';

interface QuoteToCartManagerProps {
  quote: {
    id: string;
    quote_number: string;
    version_number: number;
    total_amount: number;
    quote_items: Array<{
      id: string;
      item_name?: string;
      quantity: number;
      total_price: number;
    }>;
  };
  onConvert?: (result: any) => void;
}

export const QuoteToCartManager = ({ quote, onConvert }: QuoteToCartManagerProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const [conversionType, setConversionType] = useState<'replace' | 'add' | 'new' | null>(null);
  
  const { 
    cartInfo, 
    isLoading,
    archiveCart,
    refreshCartInfo 
  } = useEnhancedCartManager();
  
  const { convertCartToQuote, isLoading: isConverting } = useCartToQuote();

  const handleConversion = async (type: 'replace' | 'add' | 'new') => {
    try {
      let result;
      
      switch (type) {
        case 'replace':
          // Archive current cart and create new one from quote
          if (cartInfo?.id) {
            await archiveCart(cartInfo.id, `Replaced by quote ${quote.quote_number}`);
          }
          result = await convertCartToQuote(quote.id);
          break;
          
        case 'add':
          // Add quote items to existing cart
          result = await convertCartToQuote(quote.id, undefined, undefined, cartInfo?.id);
          break;
          
        case 'new':
          // Create new cart from quote (archive current if needed)
          result = await convertCartToQuote(quote.id);
          break;
      }
      
      if (result.success) {
        await refreshCartInfo();
        setShowDialog(false);
        onConvert?.(result);
      }
    } catch (error) {
      console.error('Conversion failed:', error);
    }
  };

  const openConversionDialog = (type: 'replace' | 'add' | 'new') => {
    setConversionType(type);
    setShowDialog(true);
  };

  const hasCartItems = cartInfo && cartInfo.item_count > 0;
  const isCartStale = cartInfo && new Date(cartInfo.last_activity_at) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Quote to Cart Conversion
          </CardTitle>
          <CardDescription>
            Convert this quote ({quote.quote_number}) to a shopping cart
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Current Cart Status */}
          <div className="space-y-2">
            <h4 className="font-medium">Current Cart Status</h4>
            <CartStatusIndicator 
              status={cartInfo?.lifecycle_state || 'active'} 
              itemCount={cartInfo?.item_count || 0}
            />
            
            {isCartStale && (
              <div className="flex items-center gap-2 text-amber-600 text-sm">
                <AlertTriangle className="w-4 h-4" />
                Your cart has been inactive for over a week
              </div>
            )}
          </div>

          {/* Quote Info */}
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Quote Items to Add</span>
              <Badge variant="outline">
                {quote.quote_items.length} items • ${quote.total_amount.toFixed(2)}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Version {quote.version_number} • {quote.quote_items.length} unique items
            </div>
          </div>

          {/* Conversion Options */}
          <div className="space-y-2">
            <h4 className="font-medium">Conversion Options</h4>
            
            <div className="grid gap-2">
              {hasCartItems ? (
                <>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => openConversionDialog('replace')}
                    disabled={isLoading || isConverting}
                    className="justify-start"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Replace Cart Contents
                    <Badge variant="secondary" className="ml-auto">
                      Clear {cartInfo?.item_count} items
                    </Badge>
                  </Button>
                  
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => openConversionDialog('add')}
                    disabled={isLoading || isConverting}
                    className="justify-start"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Existing Cart
                    <Badge variant="secondary" className="ml-auto">
                      ${(cartInfo?.total_amount + quote.total_amount).toFixed(2)} total
                    </Badge>
                  </Button>
                </>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => openConversionDialog('new')}
                  disabled={isLoading || isConverting}
                  className="justify-start"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Create Cart from Quote
                  <Badge variant="secondary" className="ml-auto">
                    {quote.quote_items.length} items
                  </Badge>
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => openConversionDialog('new')}
                disabled={isLoading || isConverting}
                className="justify-start"
              >
                <Archive className="w-4 h-4 mr-2" />
                Create New Cart
                <span className="text-xs text-muted-foreground ml-auto">
                  Archive current & start fresh
                </span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Confirmation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Quote to Cart Conversion</DialogTitle>
            <DialogDescription>
              {conversionType === 'replace' && 'This will replace all items in your current cart with the quote items.'}
              {conversionType === 'add' && 'This will add the quote items to your existing cart.'}
              {conversionType === 'new' && 'This will create a new cart from the quote items.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {conversionType === 'replace' && hasCartItems && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">Warning</span>
                </div>
                <div className="text-sm text-destructive/80 mt-1">
                  Your current {cartInfo?.item_count} cart items will be removed and replaced with {quote.quote_items.length} quote items.
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">Current Cart</div>
                <div className="text-muted-foreground">
                  {cartInfo?.item_count || 0} items • ${cartInfo?.total_amount.toFixed(2) || '0.00'}
                </div>
              </div>
              <div>
                <div className="font-medium">Quote Items</div>
                <div className="text-muted-foreground">
                  {quote.quote_items.length} items • ${quote.total_amount.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => conversionType && handleConversion(conversionType)}
              disabled={isConverting}
            >
              {isConverting ? 'Converting...' : 'Confirm Conversion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};