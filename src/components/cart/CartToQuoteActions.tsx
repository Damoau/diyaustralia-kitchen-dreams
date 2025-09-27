import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Replace, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CartToQuoteActionsProps {
  cartItems: any[];
  cartTotal: number;
  existingQuotes?: any[];
  onSuccess?: () => void;
}

export const CartToQuoteActions: React.FC<CartToQuoteActionsProps> = ({
  cartItems,
  cartTotal,
  existingQuotes = [],
  onSuccess
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const { toast } = useToast();

  const handleAddToQuote = async (quoteId: string) => {
    setIsConverting(true);
    try {
      const { error } = await supabase.functions.invoke('portal-cart-to-quote', {
        body: {
          action: 'add_to_existing',
          quote_id: quoteId,
          cart_items: cartItems
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Added ${cartItems.length} items to quote successfully`
      });
      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error adding to quote:', error);
      toast({
        title: "Error",
        description: "Failed to add items to quote",
        variant: "destructive"
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleReplaceQuote = async (quoteId: string) => {
    setIsConverting(true);
    try {
      const { error } = await supabase.functions.invoke('portal-cart-to-quote', {
        body: {
          action: 'replace_quote',
          quote_id: quoteId,
          cart_items: cartItems
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Quote replaced with cart items successfully"
      });
      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error replacing quote:', error);
      toast({
        title: "Error", 
        description: "Failed to replace quote",
        variant: "destructive"  
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleCreateNewQuote = async () => {
    setIsConverting(true);
    try {
      const { error } = await supabase.functions.invoke('portal-cart-to-quote', {
        body: {
          action: 'create_new',
          cart_items: cartItems
        }
      });

      if (error) throw error;

      toast({
        title: "Success", 
        description: "New quote created successfully"
      });
      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating quote:', error);
      toast({
        title: "Error",
        description: "Failed to create quote", 
        variant: "destructive"
      });
    } finally {
      setIsConverting(false);
    }
  };

  if (!cartItems.length) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Save Cart as Quote
        </Button>
      </SheetTrigger>
      
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Save Cart to Quote</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6 mt-6">
          {/* Cart Summary */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Cart Items:</span>
              <Badge variant="secondary">{cartItems.length} items</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Total:</span>
              <span className="text-lg font-bold text-primary">
                ${cartTotal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Create New Quote */}
          <div className="space-y-2">
            <Button 
              onClick={handleCreateNewQuote}
              disabled={isConverting}
              className="w-full"
              size="lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isConverting ? 'Creating...' : 'Create New Quote'}
            </Button>
          </div>

          {/* Existing Quotes */}
          {existingQuotes.length > 0 && (
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h4 className="font-medium text-sm text-muted-foreground mb-3">
                  Or update existing quote:
                </h4>
                
                <ScrollArea className="max-h-80">
                  <div className="space-y-3">
                    {existingQuotes.map((quote) => (
                      <div key={quote.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-sm">{quote.quote_number}</p>
                            <p className="text-xs text-muted-foreground">
                              ${quote.total_amount?.toLocaleString()} • {quote.quote_items?.length || 0} items
                            </p>
                          </div>
                          <Badge variant={quote.status === 'draft' ? 'secondary' : 'outline'}>
                            {quote.status}
                          </Badge>
                        </div>
                        
                        <div className="flex gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddToQuote(quote.id)}
                            disabled={isConverting}
                            className="flex-1"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReplaceQuote(quote.id)}
                            disabled={isConverting}
                            className="flex-1"
                          >
                            <Replace className="h-3 w-3 mr-1" />
                            Replace
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
