import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, Package, Truck, MapPin, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useCartPersistence } from "@/hooks/useCartPersistence";

// Input validation schema
const postcodeSchema = z.string()
  .trim()
  .regex(/^\d{4}$/, "Postcode must be 4 digits")
  .length(4, "Postcode must be exactly 4 digits");

interface PackagingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cabinetType: {
    id: string;
    name: string;
    width_mm: number;
    height_mm: number;
    depth_mm: number;
    material_type_id?: string;
    door_thickness_mm?: number;
    sm_weight_per_sqm?: number;
  } | null;
  selectedOptions: {
    doorStyleId?: string;
    colorId?: string;
    finishId?: string;
    assemblyEnabled?: boolean;
    postcode?: string;
  };
  onOptionsChange: (options: any) => void;
  onAddToCart?: (item: any) => void;
}

interface ShippingEstimate {
  eligible: boolean;
  price?: number;
  depot?: string;
  lead_time_days?: number;
  zone?: string;
}

interface AssemblyEstimate {
  eligible: boolean;
  price?: number;
  lead_time_days?: number;
  includes?: string[];
}

const PackagingModal = ({ 
  open, 
  onOpenChange, 
  cabinetType, 
  selectedOptions, 
  onOptionsChange,
  onAddToCart 
}: PackagingModalProps) => {
  const [postcode, setPostcode] = useState(selectedOptions.postcode || "");
  const [postcodeError, setPostcodeError] = useState("");
  const [assemblyEnabled, setAssemblyEnabled] = useState(selectedOptions.assemblyEnabled || false);
  const [shippingEstimate, setShippingEstimate] = useState<ShippingEstimate | null>(null);
  const [assemblyEstimate, setAssemblyEstimate] = useState<AssemblyEstimate | null>(null);
  const [calculatingShipping, setCalculatingShipping] = useState(false);

  const { addToCart } = useCartPersistence();

  // Get cabinet dimensions and calculate basic metrics
  const cabinetVolume = cabinetType ? 
    (cabinetType.width_mm * cabinetType.height_mm * cabinetType.depth_mm) / 1000000000 : 0; // m³
  
  const cabinetSurfaceArea = cabinetType ?
    ((cabinetType.width_mm * cabinetType.height_mm * 2) + 
     (cabinetType.width_mm * cabinetType.depth_mm * 4) +
     (cabinetType.height_mm * cabinetType.depth_mm * 2)) / 1000000 : 0; // m²

  // Mock postcode data until migration is approved
  const { data: postcodeData } = useQuery({
    queryKey: ['postcode-lookup', postcode],
    queryFn: async () => {
      if (!postcode || postcode.length !== 4) return null;
      
      // Mock postcode data for demo
      const mockData: Record<string, any> = {
        '3000': { postcode: '3000', state: 'VIC', zone: 'MEL_METRO', metro: true, assembly_eligible: true, delivery_eligible: true, lead_time_days: 5 },
        '3001': { postcode: '3001', state: 'VIC', zone: 'MEL_METRO', metro: true, assembly_eligible: true, delivery_eligible: true, lead_time_days: 5 },
        '4000': { postcode: '4000', state: 'QLD', zone: 'BNE_METRO', metro: true, assembly_eligible: true, delivery_eligible: true, lead_time_days: 7 },
        '2000': { postcode: '2000', state: 'NSW', zone: 'SYD_METRO', metro: true, assembly_eligible: true, delivery_eligible: true, lead_time_days: 6 },
        '6000': { postcode: '6000', state: 'WA', zone: 'PER_METRO', metro: true, assembly_eligible: false, delivery_eligible: true, lead_time_days: 10 },
      };
      
      return mockData[postcode] || null;
    },
    enabled: postcode.length === 4,
  });

  // Calculate shipping estimate when postcode changes
  useEffect(() => {
    if (postcodeData && cabinetType) {
      setCalculatingShipping(true);
      
      // Simulate shipping calculation
      setTimeout(() => {
        const baseShippingCost = postcodeData.metro ? 45 : 85;
        const volumeCharge = cabinetVolume * 150; // $150 per m³
        
        setShippingEstimate({
          eligible: postcodeData.delivery_eligible,
          price: baseShippingCost + volumeCharge,
          depot: postcodeData.metro ? 'Metro Depot' : 'Regional Depot',
          lead_time_days: postcodeData.lead_time_days,
          zone: postcodeData.zone
        });

        setAssemblyEstimate({
          eligible: postcodeData.assembly_eligible,
          price: postcodeData.assembly_eligible ? cabinetSurfaceArea * 25 : undefined, // $25 per m²
          lead_time_days: postcodeData.assembly_eligible ? postcodeData.lead_time_days + 2 : undefined,
          includes: postcodeData.assembly_eligible ? [
            'Professional installation',
            'Hardware attachment',
            'Adjustment and alignment',
            '12-month warranty'
          ] : undefined
        });
        
        setCalculatingShipping(false);
      }, 800);
    }
  }, [postcodeData, cabinetType, cabinetVolume, cabinetSurfaceArea]);

  // Handle postcode input with validation
  const handlePostcodeChange = (value: string) => {
    setPostcode(value);
    setPostcodeError("");
    
    // Clear estimates while typing
    if (value.length !== 4) {
      setShippingEstimate(null);
      setAssemblyEstimate(null);
    }

    // Validate postcode format
    if (value.length === 4) {
      try {
        postcodeSchema.parse(value);
      } catch (error) {
        if (error instanceof z.ZodError) {
          setPostcodeError(error.errors[0].message);
        }
      }
    }
  };

  // Handle assembly toggle
  const handleAssemblyToggle = (enabled: boolean) => {
    setAssemblyEnabled(enabled);
    onOptionsChange({ ...selectedOptions, assemblyEnabled: enabled });
  };

  // Calculate total price
  const getTotal = () => {
    let total = 0;
    
    // Base cabinet price (would come from pricing calculator)
    total += 250; // Mock base price
    
    // Shipping
    if (shippingEstimate?.eligible && shippingEstimate.price) {
      total += shippingEstimate.price;
    }
    
    // Assembly
    if (assemblyEnabled && assemblyEstimate?.eligible && assemblyEstimate.price) {
      total += assemblyEstimate.price;
    }
    
    return total;
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (!cabinetType) return;
    
    const cartItem = {
      cabinetType,
      selectedOptions: {
        ...selectedOptions,
        assemblyEnabled,
        postcode: postcode || undefined,
        shippingEstimate: shippingEstimate || undefined,
        assemblyEstimate: assemblyEstimate || undefined
      },
      pricing: {
        basePrice: 250,
        shippingCost: shippingEstimate?.price || 0,
        assemblyCost: assemblyEnabled && assemblyEstimate?.price ? assemblyEstimate.price : 0,
        totalPrice: getTotal()
      }
    };
    
    // Use cart persistence hook or fallback to prop
    if (onAddToCart) {
      onAddToCart(cartItem);
    } else {
      addToCart(cartItem);
    }
    
    onOpenChange(false);
  };

  if (!cabinetType) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Packaging & Assembly Options
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cabinet Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{cabinetType.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {cabinetType.width_mm}W × {cabinetType.height_mm}H × {cabinetType.depth_mm}D mm
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Volume: {cabinetVolume.toFixed(3)}m³ • Surface: {cabinetSurfaceArea.toFixed(2)}m²
                  </p>
                </div>
                <Badge variant="outline">
                  ${getTotal().toFixed(2)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Postcode Input */}
          <div className="space-y-2">
            <Label htmlFor="postcode" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Delivery Postcode
            </Label>
            <Input
              id="postcode"
              value={postcode}
              onChange={(e) => handlePostcodeChange(e.target.value)}
              placeholder="e.g., 3000"
              maxLength={4}
              className={postcodeError ? "border-destructive" : ""}
            />
            {postcodeError && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {postcodeError}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Enter your postcode to see shipping and assembly options
            </p>
          </div>

          {/* Shipping Estimate */}
          {postcode.length === 4 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Truck className="h-4 w-4" />
                  <h4 className="font-medium">Shipping Estimate</h4>
                  {calculatingShipping && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                  )}
                </div>
                
                {shippingEstimate ? (
                  <div className="space-y-2">
                    {shippingEstimate.eligible ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Delivery to {postcode}</span>
                          <Badge variant="default">${shippingEstimate.price?.toFixed(2)}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                          <div>From: {shippingEstimate.depot}</div>
                          <div>Lead time: {shippingEstimate.lead_time_days} days</div>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-600">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">Delivery not available to this postcode</span>
                      </div>
                    )}
                  </div>
                ) : postcodeData === null && !calculatingShipping ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Postcode not found in our delivery zones</span>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}

          {/* Assembly Options */}
          {assemblyEstimate && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    <h4 className="font-medium">Assembly Service</h4>
                  </div>
                  <Switch
                    checked={assemblyEnabled}
                    onCheckedChange={handleAssemblyToggle}
                    disabled={!assemblyEstimate.eligible}
                  />
                </div>

                {assemblyEstimate.eligible ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Professional assembly</span>
                      <Badge variant={assemblyEnabled ? "default" : "secondary"}>
                        ${assemblyEstimate.price?.toFixed(2)}
                      </Badge>
                    </div>
                    
                    {assemblyEnabled && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          Lead time: {assemblyEstimate.lead_time_days} days (includes delivery + assembly)
                        </p>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Includes:</p>
                          {assemblyEstimate.includes?.map((item, index) => (
                            <p key={index} className="text-xs text-muted-foreground ml-2">
                              • {item}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Assembly not available in this area</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleAddToCart}>
                Add to Cart
              </Button>
              <Button onClick={handleAddToCart} className="min-w-[120px]">
                Add - ${getTotal().toFixed(2)}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PackagingModal;