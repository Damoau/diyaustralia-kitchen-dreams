import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Star, DollarSign, Settings, Save } from 'lucide-react';
import { useHardwarePricing } from '@/hooks/useHardwarePricing';

interface HardwareBrandSelectorProps {
  category: 'hinge' | 'runner';
  brands: Array<{ 
    brandId: string; 
    quantity: number; 
    isDefault: boolean; 
  }>;
  onBrandsChange: (brands: Array<{ brandId: string; quantity: number; isDefault: boolean; }>) => void;
}

export const HardwareBrandSelector: React.FC<HardwareBrandSelectorProps> = ({
  category,
  brands,
  onBrandsChange
}) => {
  const { getHardwareOptions } = useHardwarePricing();
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedHardwareSet, setSelectedHardwareSet] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  
  // Get all available hardware options for this category
  const allHardwareOptions = getHardwareOptions(category) || [];
  
  // Group hardware options by brand
  const brandGroups = allHardwareOptions.reduce((acc, option) => {
    const brandName = option.brandName;
    if (!acc[brandName]) {
      acc[brandName] = [];
    }
    acc[brandName].push(option);
    return acc;
  }, {} as Record<string, typeof allHardwareOptions>);
  
  const availableBrands = Object.keys(brandGroups);

  const getHardwareOptionById = (id: string) => {
    return allHardwareOptions.find(opt => opt.id === id);
  };

  const handleAddHardware = () => {
    setIsAddDialogOpen(true);
    setSelectedHardwareSet('');
    setQuantity(1);
  };

  const handleSaveHardware = () => {
    if (!selectedHardwareSet) return;
    
    const newBrands = [...brands, {
      brandId: selectedHardwareSet,
      quantity: quantity,
      isDefault: brands.length === 0 // First set is default
    }];
    
    onBrandsChange(newBrands);
    setIsAddDialogOpen(false);
    setSelectedHardwareSet('');
    setQuantity(1);
  };

  const removeBrand = (index: number) => {
    const newBrands = brands.filter((_, i) => i !== index);
    // If we removed the default brand, make the first remaining brand default
    if (newBrands.length > 0 && !newBrands.some(b => b.isDefault)) {
      newBrands[0].isDefault = true;
    }
    onBrandsChange(newBrands);
  };

  const updateBrand = (index: number, field: keyof typeof brands[0], value: any) => {
    const newBrands = [...brands];
    
    if (field === 'isDefault' && value) {
      // If setting this as default, remove default from others
      newBrands.forEach((brand, i) => {
        brand.isDefault = i === index;
      });
    } else {
      newBrands[index] = { ...newBrands[index], [field]: value };
    }
    
    onBrandsChange(newBrands);
  };

  if (availableBrands.length === 0) {
    return (
      <div className="space-y-3">
        <Label>Hardware Brand Configuration</Label>
        <div className="p-4 border rounded-lg bg-muted/30">
          <p className="text-sm text-muted-foreground">
            No {category} hardware sets available. Please configure hardware sets first.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => {
              console.log('Open hardware set configurator for', category);
            }}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configure Hardware Sets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label>Hardware Brand Configuration</Label>
        
        {/* Step 1: Brand Selection */}
        <div className="space-y-2">
          <Label className="text-sm">Select Brand</Label>
          <Select
            value={selectedBrand}
            onValueChange={setSelectedBrand}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={`Choose ${category} brand...`} />
            </SelectTrigger>
            <SelectContent>
              {availableBrands.map((brandName) => (
                <SelectItem key={brandName} value={brandName}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{brandName}</span>
                    <Badge variant="outline" className="text-xs">
                      {brandGroups[brandName].length} sets available
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Step 2: Add Hardware Button (only shows after brand selection) */}
        {selectedBrand && (
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
            <div>
              <p className="text-sm font-medium">
                {selectedBrand} {category === 'hinge' ? 'Hinge' : 'Runner'} Sets
              </p>
              <p className="text-xs text-muted-foreground">
                {brandGroups[selectedBrand].length} hardware sets available from global settings
              </p>
            </div>
            <Button onClick={handleAddHardware} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Hardware
            </Button>
          </div>
        )}
      </div>

      {/* Step 3: Added Hardware Configuration */}
      {brands.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Added Hardware Sets</Label>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {brands.map((brand, index) => {
              const hardwareOption = getHardwareOptionById(brand.brandId);
              const pricing = hardwareOption?.pricing;
              
              if (!hardwareOption) return null;
              
              return (
                <div key={index} className="p-3 border rounded-lg bg-background">
                  <div className="grid grid-cols-12 gap-3 items-center">
                    {/* Hardware Set Name */}
                    <div className="col-span-5">
                      <Label className="text-xs">Hardware Set</Label>
                      <div className="text-sm font-medium truncate" title={hardwareOption.name}>
                        {hardwareOption.name}
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="col-span-2">
                      <Label className="text-xs">Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={brand.quantity}
                        onChange={(e) => updateBrand(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="h-8"
                      />
                    </div>

                    {/* Pricing Display */}
                    <div className="col-span-3">
                      <Label className="text-xs">Total Price</Label>
                      <div className="flex items-center gap-1 text-sm">
                        <DollarSign className="h-3 w-3" />
                        <span className="font-medium">
                          {pricing ? (pricing.finalCost * brand.quantity).toFixed(2) : '0.00'}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ${pricing?.finalCost.toFixed(2) || '0.00'} × {brand.quantity}
                      </div>
                    </div>

                    {/* Default Toggle */}
                    <div className="col-span-1 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-1">
                        <Label className="text-xs">Default</Label>
                        <Button
                          type="button"
                          variant={brand.isDefault ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateBrand(index, 'isDefault', true)}
                          className="h-6 w-6 p-0"
                        >
                          <Star className={`h-3 w-3 ${brand.isDefault ? 'fill-current' : ''}`} />
                        </Button>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <div className="col-span-1 flex justify-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBrand(index)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Additional Pricing Info */}
                  {pricing && (
                    <div className="mt-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                      <div className="grid grid-cols-2 gap-2">
                        <span>Base Cost: ${pricing.baseCost.toFixed(2)}</span>
                        <span>Final Cost: ${pricing.finalCost.toFixed(2)}</span>
                        {pricing.markup > 0 && (
                          <span>Markup: {pricing.markup}%</span>
                        )}
                        {pricing.discount > 0 && (
                          <span>Discount: {pricing.discount}%</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 4: Add Hardware Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add {selectedBrand} Hardware Set</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Hardware Set Selection */}
            <div>
              <Label>Select Hardware Set</Label>
              <Select value={selectedHardwareSet} onValueChange={setSelectedHardwareSet}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose hardware set..." />
                </SelectTrigger>
                <SelectContent>
                  {selectedBrand && brandGroups[selectedBrand]?.map((hardwareSet) => {
                    const isAlreadyAdded = brands.some(b => b.brandId === hardwareSet.id);
                    const pricing = hardwareSet.pricing;
                    
                    return (
                      <SelectItem 
                        key={hardwareSet.id} 
                        value={hardwareSet.id}
                        disabled={isAlreadyAdded}
                      >
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{hardwareSet.setName}</span>
                            {hardwareSet.isDefault && (
                              <Badge variant="secondary" className="text-xs">Global Default</Badge>
                            )}
                            {isAlreadyAdded && (
                              <Badge variant="outline" className="text-xs">Already Added</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Base: ${pricing?.baseCost?.toFixed(2) || '0.00'} • 
                            Final: ${pricing?.finalCost?.toFixed(2) || '0.00'}
                            {pricing?.markup > 0 && ` • ${pricing.markup}% markup`}
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity Selection */}
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                placeholder="Enter quantity"
              />
            </div>

            {/* Preview */}
            {selectedHardwareSet && (
              <div className="p-3 border rounded-lg bg-muted/20">
                <h4 className="text-sm font-medium mb-2">Preview</h4>
                {(() => {
                  const selectedOption = allHardwareOptions.find(opt => opt.id === selectedHardwareSet);
                  const pricing = selectedOption?.pricing;
                  return (
                    <div className="text-sm">
                      <p><span className="font-medium">Set:</span> {selectedOption?.name}</p>
                      <p><span className="font-medium">Quantity:</span> {quantity}</p>
                      <p><span className="font-medium">Unit Price:</span> ${pricing?.finalCost?.toFixed(2) || '0.00'}</p>
                      <p className="font-medium text-primary">
                        <span>Total Price:</span> ${pricing ? (pricing.finalCost * quantity).toFixed(2) : '0.00'}
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveHardware} 
              disabled={!selectedHardwareSet}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Hardware Set
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded border border-blue-200">
        <p className="font-medium text-blue-900 mb-1">How it works:</p>
        <ul className="space-y-1 text-blue-800">
          <li>• Select a brand (Blum, Titus) from the dropdown</li>
          <li>• Click "Add Hardware" to choose from global hardware settings</li>
          <li>• Select specific hardware sets and quantities</li>
          <li>• Save to add them to your configuration</li>
          <li>• Pricing automatically syncs with global settings</li>
        </ul>
      </div>
    </div>
  );
};