import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { CabinetType } from '@/types/cabinet';
import { useCart } from '@/hooks/useCart';
import { useProductIntegration } from '@/hooks/useProductIntegration';
import { useToast } from '@/hooks/use-toast';

interface ProductConfiguratorDialogProps {
  cabinetType: CabinetType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialWidth?: number;
}

interface ProductConfiguration {
  productId: string;
  selectedOptions: Record<string, string>;
  dimensions: { width: number; height: number; depth: number };
  quantity: number;
}

export function ProductConfiguratorDialog({ 
  cabinetType, 
  open, 
  onOpenChange, 
  initialWidth 
}: ProductConfiguratorDialogProps) {
  const { toast } = useToast();
  const { addToCart, isLoading: isAddingToCart } = useCart();
  const { 
    cabinetProducts, 
    getProductOptions, 
    createVariantForConfiguration, 
    calculatePriceFromVariant 
  } = useProductIntegration();

  // Find the product associated with this cabinet type
  const cabinetProduct = cabinetProducts.find(p => 
    p.title.toLowerCase().includes(cabinetType.name.toLowerCase()) ||
    p.handle.includes(cabinetType.name.toLowerCase().replace(/\s+/g, '-'))
  );

  const [configuration, setConfiguration] = useState<ProductConfiguration>({
    productId: cabinetProduct?.id || '',
    selectedOptions: {},
    dimensions: {
      width: initialWidth || cabinetType.default_width_mm,
      height: cabinetType.default_height_mm,
      depth: cabinetType.default_depth_mm
    },
    quantity: 1
  });

  const [productOptions, setProductOptions] = useState<any[]>([]);
  const [estimatedPrice, setEstimatedPrice] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Load product options when dialog opens or product changes
  useEffect(() => {
    if (open && cabinetProduct) {
      loadProductOptions();
    }
  }, [open, cabinetProduct]);

  // Calculate price when configuration changes
  useEffect(() => {
    if (configuration.productId && Object.keys(configuration.selectedOptions).length > 0) {
      calculatePrice();
    }
  }, [configuration]);

  const loadProductOptions = async () => {
    if (!cabinetProduct) return;
    
    setLoading(true);
    try {
      const options = await getProductOptions(cabinetProduct.id);
      setProductOptions(options);
      
      // Auto-select first available option for each
      const autoSelections: Record<string, string> = {};
      options.forEach(option => {
        if (option.option_values && option.option_values.length > 0) {
          autoSelections[option.name] = option.option_values[0].code;
        }
      });
      
      setConfiguration(prev => ({
        ...prev,
        productId: cabinetProduct.id,
        selectedOptions: autoSelections
      }));
    } catch (error) {
      console.error('Error loading product options:', error);
      toast({
        title: "Error",
        description: "Failed to load product options",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const calculatePrice = async () => {
    try {
      // Create a temporary variant to calculate price
      const tempVariant = await createVariantForConfiguration(
        configuration.productId,
        configuration.selectedOptions,
        configuration.dimensions
      );
      
      if (tempVariant) {
        const price = await calculatePriceFromVariant(tempVariant.id);
        setEstimatedPrice(price * configuration.quantity);
      }
    } catch (error) {
      console.error('Error calculating price:', error);
    }
  };

  const handleOptionChange = (optionName: string, value: string) => {
    setConfiguration(prev => ({
      ...prev,
      selectedOptions: {
        ...prev.selectedOptions,
        [optionName]: value
      }
    }));
  };

  const handleDimensionChange = (dimension: keyof typeof configuration.dimensions, value: number) => {
    setConfiguration(prev => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [dimension]: value
      }
    }));
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, configuration.quantity + delta);
    setConfiguration(prev => ({
      ...prev,
      quantity: newQuantity
    }));
  };

  const handleAddToCart = async () => {
    if (!cabinetProduct) {
      toast({
        title: "Error",
        description: "No product selected",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Create a variant for this specific configuration
      const variant = await createVariantForConfiguration(
        configuration.productId,
        configuration.selectedOptions,
        configuration.dimensions
      );

      if (!variant) {
        throw new Error('Failed to create product variant');
      }

      // Add to cart using the new product-based system
      const cartConfiguration = {
        cabinetType,
        width: configuration.dimensions.width,
        height: configuration.dimensions.height,
        depth: configuration.dimensions.depth,
        quantity: configuration.quantity,
        productVariant: variant,
        productOptions: configuration.selectedOptions
      };

      // Use empty settings for now - the product system handles pricing internally
      const { parseGlobalSettings } = await import('@/lib/pricing');
      const emptySettings = parseGlobalSettings([]);
      await addToCart(cartConfiguration, [], emptySettings);
      
      toast({
        title: "Success",
        description: `Added ${configuration.quantity} cabinet(s) to cart`,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  if (!cabinetProduct) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Product Not Found</DialogTitle>
            <DialogDescription>
              No product found for {cabinetType.name}. Please ensure the product catalog is properly set up.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Configure {cabinetProduct.title}
          </DialogTitle>
          <DialogDescription>
            Customize your cabinet dimensions and options
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
              </div>
              <p className="text-muted-foreground mt-4">Loading options...</p>
            </div>
          ) : (
            <>
              {/* Dimensions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Dimensions (mm)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Width</Label>
                      <Input
                        type="number"
                        value={configuration.dimensions.width}
                        onChange={(e) => handleDimensionChange('width', Number(e.target.value))}
                        min={cabinetType.min_width_mm}
                        max={cabinetType.max_width_mm}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {cabinetType.min_width_mm} - {cabinetType.max_width_mm}mm
                      </p>
                    </div>
                    <div>
                      <Label>Height</Label>
                      <Input
                        type="number"
                        value={configuration.dimensions.height}
                        onChange={(e) => handleDimensionChange('height', Number(e.target.value))}
                        min={cabinetType.min_height_mm}
                        max={cabinetType.max_height_mm}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {cabinetType.min_height_mm} - {cabinetType.max_height_mm}mm
                      </p>
                    </div>
                    <div>
                      <Label>Depth</Label>
                      <Input
                        type="number"
                        value={configuration.dimensions.depth}
                        onChange={(e) => handleDimensionChange('depth', Number(e.target.value))}
                        min={cabinetType.min_depth_mm}
                        max={cabinetType.max_depth_mm}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {cabinetType.min_depth_mm} - {cabinetType.max_depth_mm}mm
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Product Options */}
              {productOptions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {productOptions.map((option) => (
                      <div key={option.id}>
                        <Label>{option.name}</Label>
                        <Select
                          value={configuration.selectedOptions[option.name] || ''}
                          onValueChange={(value) => handleOptionChange(option.name, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Select ${option.name.toLowerCase()}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {option.option_values?.map((value: any) => (
                              <SelectItem key={value.id} value={value.code}>
                                <div className="flex items-center gap-2">
                                  {value.swatch_hex && (
                                    <div
                                      className="w-4 h-4 rounded border"
                                      style={{ backgroundColor: value.swatch_hex }}
                                    />
                                  )}
                                  <span>{value.value}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Quantity and Pricing */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Label>Quantity</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(-1)}
                          disabled={configuration.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{configuration.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Estimated Total</p>
                      <p className="text-2xl font-bold">
                        ${estimatedPrice.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddToCart} 
                  disabled={isAddingToCart || loading || Object.keys(configuration.selectedOptions).length === 0}
                  className="flex-1"
                >
                  {isAddingToCart || loading ? 'Adding...' : 'Add to Cart'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}