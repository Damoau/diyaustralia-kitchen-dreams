import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Plus, RefreshCw, Trash2, DollarSign } from "lucide-react";

interface CartChoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingCartTotal: number;
  existingItemCount: number;
  newItemsTotal: number;
  newItemCount: number;
  onChoice: (choice: 'replace' | 'merge' | 'new') => void;
  isProcessing?: boolean;
}

export const CartChoiceDialog = ({
  open,
  onOpenChange,
  existingCartTotal,
  existingItemCount,
  newItemsTotal,
  newItemCount,
  onChoice,
  isProcessing = false
}: CartChoiceDialogProps) => {
  const [selectedChoice, setSelectedChoice] = useState<'replace' | 'merge' | 'new' | null>(null);

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);

  const handleConfirm = () => {
    if (selectedChoice) {
      onChoice(selectedChoice);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cart Already Has Items</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">
            Your cart already contains items. How would you like to handle the new quote items?
          </div>

          {/* Current Cart Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Current Cart
                </h3>
                <Badge variant="secondary">
                  {existingItemCount} item{existingItemCount !== 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(existingCartTotal)}
              </div>
            </CardContent>
          </Card>

          {/* New Items Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Quote Items to Add
                </h3>
                <Badge variant="secondary">
                  {newItemCount} item{newItemCount !== 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(newItemsTotal)}
              </div>
            </CardContent>
          </Card>

          {/* Choice Options */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Choose an action:</div>
            
            {/* Replace Option */}
            <Card 
              className={`cursor-pointer transition-colors ${
                selectedChoice === 'replace' ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
              }`}
              onClick={() => setSelectedChoice('replace')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <RefreshCw className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Replace Cart Contents</div>
                    <div className="text-sm text-muted-foreground">
                      Clear existing items and add quote items only
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(newItemsTotal)}</div>
                    <div className="text-sm text-muted-foreground">New total</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Merge Option */}
            <Card 
              className={`cursor-pointer transition-colors ${
                selectedChoice === 'merge' ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
              }`}
              onClick={() => setSelectedChoice('merge')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Plus className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Add to Existing Cart</div>
                    <div className="text-sm text-muted-foreground">
                      Keep current items and add quote items (duplicates will be merged)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(existingCartTotal + newItemsTotal)}</div>
                    <div className="text-sm text-muted-foreground">Combined total</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* New Cart Option */}
            <Card 
              className={`cursor-pointer transition-colors ${
                selectedChoice === 'new' ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
              }`}
              onClick={() => setSelectedChoice('new')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <ShoppingCart className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Create New Cart</div>
                    <div className="text-sm text-muted-foreground">
                      Save current cart and start fresh with quote items
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(newItemsTotal)}</div>
                    <div className="text-sm text-muted-foreground">New cart total</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={!selectedChoice || isProcessing}
              className="min-w-[120px]"
            >
              {isProcessing ? 'Processing...' : 'Confirm'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};