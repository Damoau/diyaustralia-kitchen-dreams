import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useSavedCarts } from "@/hooks/useSavedCarts";
import { ShoppingCart, Trash2, RotateCcw, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";

export const SavedCarts = () => {
  const { savedCarts, isLoading, error, restoreCart, deleteCart } = useSavedCarts();
  const [operatingCartId, setOperatingCartId] = useState<string | null>(null);

  const handleRestoreCart = async (cartId: string) => {
    setOperatingCartId(cartId);
    try {
      await restoreCart(cartId);
    } finally {
      setOperatingCartId(null);
    }
  };

  const handleDeleteCart = async (cartId: string) => {
    setOperatingCartId(cartId);
    try {
      await deleteCart(cartId);
    } finally {
      setOperatingCartId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-destructive">Failed to load saved carts: {error}</p>
      </div>
    );
  }

  if (!savedCarts || savedCarts.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="No Saved Carts"
        description="You haven't saved any carts yet. Save a cart from the shopping cart page to access it later."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Saved Carts</h1>
        <p className="text-muted-foreground mt-2">
          Manage your saved carts and restore them when you're ready to continue shopping.
        </p>
      </div>

      <div className="grid gap-4">
        {savedCarts.map((cart) => (
          <Card key={cart.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {cart.name}
                    <Badge variant="secondary">
                      {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Saved {format(new Date(cart.abandoned_at!), 'MMM d, yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      ${cart.total_amount.toLocaleString()}
                    </span>
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleRestoreCart(cart.id)}
                    disabled={operatingCartId === cart.id}
                    size="sm"
                  >
                    {operatingCartId === cart.id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <RotateCcw className="w-4 h-4 mr-1" />
                    )}
                    Restore
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={operatingCartId === cart.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Saved Cart</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to permanently delete "{cart.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteCart(cart.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            {cart.items.length > 0 && (
              <CardContent>
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Cart Contents:</h4>
                  <div className="space-y-2">
                    {cart.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.cabinet_type?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.width_mm}mm × {item.height_mm}mm × {item.depth_mm}mm
                            {item.door_style && ` • ${item.door_style.name}`}
                            {item.color && ` • ${item.color.name}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">Qty: {item.quantity}</p>
                          <p className="text-xs text-muted-foreground">${item.total_price.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                    {cart.items.length > 3 && (
                      <div className="text-center py-2">
                        <p className="text-sm text-muted-foreground">
                          and {cart.items.length - 3} more {cart.items.length - 3 === 1 ? 'item' : 'items'}
                        </p>
                      </div>
                    )}
                  </div>
                  {cart.abandon_reason && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          <strong>Note:</strong> {cart.abandon_reason}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};