import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Minus, Plus } from 'lucide-react';
import { CabinetType } from '@/types/cabinet';
import { useDynamicPricing } from '@/hooks/useDynamicPricing';
import { useToast } from '@/hooks/use-toast';
import { pricingService } from '@/services/pricingService';
import { PriceBreakdown } from '@/components/cabinet/PriceBreakdown';
import { HardwareBrandSelector } from '@/components/cabinet/HardwareBrandSelector';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface QuoteConfiguratorDialogProps {
  cabinetType: CabinetType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToQuote: (item: any) => void;
  initialWidth?: number;
}

export function QuoteConfiguratorDialog({ 
  cabinetType, 
  open, 
  onOpenChange, 
  onAddToQuote,
  initialWidth 
}: QuoteConfiguratorDialogProps) {
  const [width, setWidth] = useState(initialWidth || cabinetType.default_width_mm);
  const [height, setHeight] = useState(cabinetType.default_height_mm);
  const [depth, setDepth] = useState(cabinetType.default_depth_mm);
  const [quantity, setQuantity] = useState(1);
  const [selectedDoorStyle, setSelectedDoorStyle] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedFinish, setSelectedFinish] = useState<string>('');
  const [selectedHardwareBrand, setSelectedHardwareBrand] = useState<string>('');

  const { toast } = useToast();

  // Fetch door styles
  const { data: doorStyles } = useQuery({
    queryKey: ['door-styles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('door_styles')
        .select('*')
        .eq('active', true)
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Fetch colors
  const { data: colors } = useQuery({
    queryKey: ['colors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('colors')
        .select('*')
        .eq('active', true)
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Note: Finishes functionality temporarily disabled due to schema issues
  const finishes: any[] = [];

  const { 
    price, 
    priceBreakdown, 
    isLoading: pricingLoading,
    cabinetType: dynamicCabinetType
  } = useDynamicPricing({
    cabinetTypeId: cabinetType?.id,
    width,
    height,
    depth,
    doorStyleId: selectedDoorStyle || undefined,
    colorId: selectedColor || undefined,
    quantity
  });

  const finalPrice = priceBreakdown?.finalTotal || price || 0;

  // No need for useEffect to calculate price - useDynamicPricing handles it automatically

  const handleAddToQuote = () => {
    if (!cabinetType) return;

    const selectedDoorStyleData = doorStyles?.find(ds => ds.id === selectedDoorStyle);
    const selectedColorData = colors?.find(c => c.id === selectedColor);
    const selectedFinishData = finishes?.find(f => f.id === selectedFinish);

    const item = {
      cabinetTypeId: cabinetType.id,
      cabinet_type_id: cabinetType.id,
      name: cabinetType.name,
      cabinet_name: `${cabinetType.name}${selectedDoorStyleData ? ` - ${selectedDoorStyleData.name}` : ''}${selectedColorData ? ` - ${selectedColorData.name}` : ''}`,
      quantity,
      width,
      height,
      depth,
      width_mm: width,
      height_mm: height,
      depth_mm: depth,
      price: finalPrice,
      unit_price: finalPrice,
      unitPrice: finalPrice,
      total_price: finalPrice * quantity,
      totalPrice: finalPrice * quantity,
      doorStyleId: selectedDoorStyle || undefined,
      door_style_id: selectedDoorStyle || undefined,
      colorId: selectedColor || undefined,
      color_id: selectedColor || undefined,
      finishId: selectedFinish || undefined,
      finish_id: selectedFinish || undefined,
      configuration: {
        width,
        height,
        depth,
        doorStyle: selectedDoorStyleData?.name,
        color: selectedColorData?.name,
        finish: selectedFinishData?.name,
        hardwareBrand: selectedHardwareBrand,
        priceBreakdown
      }
    };

    onAddToQuote(item);
    toast({
      title: "Item Added",
      description: `${quantity}x ${cabinetType.name} added to quote`
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{cabinetType?.name} Configuration</DialogTitle>
          <DialogDescription>
            Configure your cabinet and add it to the quote
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Configuration */}
          <div className="space-y-6">
            {/* Dimensions */}
            <Card>
              <CardHeader>
                <CardTitle>Dimensions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="width">Width (mm)</Label>
                    <Input
                      id="width"
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(parseInt(e.target.value) || 0)}
                      min={cabinetType?.min_width_mm || 100}
                      max={cabinetType?.max_width_mm || 1200}
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">Height (mm)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                      min={cabinetType?.min_height_mm || 200}
                      max={cabinetType?.max_height_mm || 1000}
                    />
                  </div>
                  <div>
                    <Label htmlFor="depth">Depth (mm)</Label>
                    <Input
                      id="depth"
                      type="number"
                      value={depth}
                      onChange={(e) => setDepth(parseInt(e.target.value) || 0)}
                      min={cabinetType?.min_depth_mm || 200}
                      max={cabinetType?.max_depth_mm || 800}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Door Style & Finishes */}
            <Card>
              <CardHeader>
                <CardTitle>Door Style & Finish</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="door-style">Door Style</Label>
                  <Select value={selectedDoorStyle} onValueChange={setSelectedDoorStyle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select door style" />
                    </SelectTrigger>
                    <SelectContent>
                      {doorStyles?.map(style => (
                        <SelectItem key={style.id} value={style.id}>
                          {style.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="color">Color</Label>
                  <Select value={selectedColor} onValueChange={setSelectedColor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      {colors?.map(color => (
                        <SelectItem key={color.id} value={color.id}>
                          {color.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedDoorStyle && (
                  <div>
                    <Label htmlFor="finish">Finish</Label>
                    <Select value={selectedFinish} onValueChange={setSelectedFinish}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select finish" />
                      </SelectTrigger>
                      <SelectContent>
                        {finishes?.map(finish => (
                          <SelectItem key={finish.id} value={finish.id}>
                            {finish.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

                {/* Hardware - Simplified for now */}
                <div>
                  <Label htmlFor="hardware">Hardware Brand</Label>
                  <Select value={selectedHardwareBrand} onValueChange={setSelectedHardwareBrand}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select hardware brand" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blum">Blum</SelectItem>
                      <SelectItem value="hettich">Hettich</SelectItem>
                      <SelectItem value="salice">Salice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Configuration Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Cabinet:</span>
                    <span className="font-medium">{cabinetType?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dimensions:</span>
                    <span>{width} × {height} × {depth}mm</span>
                  </div>
                  {selectedDoorStyle && (
                    <div className="flex justify-between">
                      <span>Door Style:</span>
                      <span>{doorStyles?.find(ds => ds.id === selectedDoorStyle)?.name}</span>
                    </div>
                  )}
                  {selectedColor && (
                    <div className="flex justify-between">
                      <span>Color:</span>
                      <span>{colors?.find(c => c.id === selectedColor)?.name}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <Label>Quantity:</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="px-4 py-2 border rounded">{quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Price Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Price Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {priceBreakdown && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Carcass:</span>
                      <span>${priceBreakdown.carcassCosts?.total?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Door & Finish:</span>
                      <span>${priceBreakdown.doorCosts?.total?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Hardware:</span>
                      <span>${priceBreakdown.hardwareCost?.toLocaleString() || '0'}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Unit Price:</span>
                      <span>${finalPrice.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Add to Quote */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold">
                    ${(finalPrice * quantity).toLocaleString()}
                  </span>
                </div>
                <Button 
                  onClick={handleAddToQuote}
                  className="w-full"
                  disabled={pricingLoading || finalPrice <= 0}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Quote
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}