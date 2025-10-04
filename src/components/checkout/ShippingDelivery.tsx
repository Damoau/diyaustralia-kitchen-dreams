import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Truck, MapPin, Home, Building, Clock, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { EnhancedShippingCalculator } from './EnhancedShippingCalculator';
import { useCartMigration } from "@/hooks/useCartMigration";
import { supabase } from '@/integrations/supabase/client';

interface ShippingAddress {
  firstName: string;
  lastName: string;
  company?: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
  instructions?: string;
}

interface DeliveryOption {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
  availableForPostcode: boolean;
  assemblyAvailable?: boolean;
  assemblyPrice?: number;
}

interface ShippingDeliveryProps {
  checkoutId: string;
  onComplete: (data: any) => void;
  customerData: any;
}

export const ShippingDelivery = ({ checkoutId, onComplete, customerData }: ShippingDeliveryProps) => {
  const { cart } = useCartMigration();
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: customerData?.customer_first_name || '',
    lastName: customerData?.customer_last_name || '',
    company: customerData?.customer_company || '',
    address: '',
    suburb: '',
    state: 'NSW',
    postcode: '',
    country: 'Australia',
    phone: customerData?.customer_phone || '',
    instructions: '',
  });

  const [selectedDelivery, setSelectedDelivery] = useState<string>('');
  const [addAssembly, setAddAssembly] = useState<boolean>(false);
  const [postcodeChecked, setPostcodeChecked] = useState<boolean>(false);
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [calculatedShippingCost, setCalculatedShippingCost] = useState<number>(0);

  // Default delivery options (would typically come from API)
  const baseDeliveryOptions: DeliveryOption[] = [
    {
      id: 'standard',
      name: 'Standard Delivery',
      description: 'Delivery to your door. You arrange unloading.',
      price: 150,
      estimatedDays: '7-14 business days',
      availableForPostcode: true,
    },
    {
      id: 'white-glove',
      name: 'White Glove Service',
      description: 'Delivery and placement in your home. Professional unloading.',
      price: 350,
      estimatedDays: '10-21 business days',
      availableForPostcode: true,
      assemblyAvailable: true,
      assemblyPrice: 500,
    },
    {
      id: 'express',
      name: 'Express Delivery',
      description: 'Priority delivery for urgent orders.',
      price: 250,
      estimatedDays: '3-7 business days',
      availableForPostcode: false, // Will be set based on postcode
    },
  ];

  const australianStates = [
    { value: 'NSW', label: 'New South Wales' },
    { value: 'VIC', label: 'Victoria' },
    { value: 'QLD', label: 'Queensland' },
    { value: 'WA', label: 'Western Australia' },
    { value: 'SA', label: 'South Australia' },
    { value: 'TAS', label: 'Tasmania' },
    { value: 'ACT', label: 'Australian Capital Territory' },
    { value: 'NT', label: 'Northern Territory' },
  ];

  const handleInputChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const checkPostcodeEligibility = async (postcode: string) => {
    if (!postcode || postcode.length !== 4) return;

    setIsLoading(true);
    try {
      // Check assembly eligibility using the dedicated edge function
      const { data: assemblyCheck, error: assemblyError } = await supabase.functions.invoke('check-assembly-eligibility', {
        body: { postcode }
      });

      if (assemblyError) {
        console.error('Assembly check error:', assemblyError);
      }

      // Check delivery zones
      const { data: postcodeZone } = await supabase
        .from('postcode_zones')
        .select('*')
        .eq('postcode', postcode)
        .single();

      const isMetropolitan = postcodeZone?.metro || false;
      const assemblyEligible = assemblyCheck?.eligible || false;
      const assemblySurcharges = assemblyCheck?.surcharges || { carcass: 0, doors: 0 };

      const updatedOptions = baseDeliveryOptions.map(option => {
        let updatedOption = {
          ...option,
          availableForPostcode: option.id === 'express' ? isMetropolitan : true,
        };

        // Update assembly availability and pricing based on API response
        if (option.assemblyAvailable) {
          updatedOption.assemblyAvailable = assemblyEligible;
          if (assemblyEligible && option.assemblyPrice) {
            // Apply surcharges if any
            const surchargeAmount = (assemblySurcharges.carcass + assemblySurcharges.doors) / 100 * option.assemblyPrice;
            updatedOption.assemblyPrice = option.assemblyPrice + surchargeAmount;
          }
        }

        return updatedOption;
      });

      setDeliveryOptions(updatedOptions);
      setPostcodeChecked(true);
    } catch (error) {
      console.error('Error checking postcode:', error);
      // Fallback to basic options if API fails
      setDeliveryOptions(baseDeliveryOptions);
      setPostcodeChecked(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (shippingAddress.postcode.length === 4) {
      checkPostcodeEligibility(shippingAddress.postcode);
    } else {
      setPostcodeChecked(false);
      setDeliveryOptions([]);
    }
  }, [shippingAddress.postcode]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!shippingAddress.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!shippingAddress.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!shippingAddress.address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (!shippingAddress.suburb.trim()) {
      newErrors.suburb = 'Suburb is required';
    }
    if (!shippingAddress.postcode.trim()) {
      newErrors.postcode = 'Postcode is required';
    } else if (!/^\d{4}$/.test(shippingAddress.postcode)) {
      newErrors.postcode = 'Postcode must be 4 digits';
    }
    if (!shippingAddress.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    if (!selectedDelivery) {
      newErrors.delivery = 'Please select a delivery option';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleShippingCalculated = (cost: number, method: string) => {
    setCalculatedShippingCost(cost);
    // Auto-select the calculated shipping option if it matches our available options
    const matchingOption = deliveryOptions.find(opt => 
      opt.name.toLowerCase().includes(method.toLowerCase())
    );
    if (matchingOption) {
      setSelectedDelivery(matchingOption.id);
    }
  };

  const calculateDeliveryTotal = () => {
    const selectedOption = deliveryOptions.find(opt => opt.id === selectedDelivery);
    if (!selectedOption) return 0;
    
    let total = selectedOption.price;
    
    // Use calculated shipping cost if available and higher
    if (calculatedShippingCost > 0) {
      total = Math.max(total, calculatedShippingCost);
    }
    
    if (addAssembly && selectedOption.assemblyAvailable && selectedOption.assemblyPrice) {
      total += selectedOption.assemblyPrice;
    }
    return total;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const selectedOption = deliveryOptions.find(opt => opt.id === selectedDelivery);
    const deliveryTotal = calculateDeliveryTotal();

    const shippingData = {
      address: shippingAddress,
      delivery: {
        option: selectedOption,
        addAssembly,
        totalCost: deliveryTotal,
      },
      estimatedDelivery: selectedOption?.estimatedDays,
      checkoutId, // Include checkout ID for tracking
    };

    console.log('🚚 Shipping data submitted:', shippingData);
    onComplete(shippingData);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Truck className="h-5 w-5" />
          <span>Shipping & Delivery</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Shipping Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Delivery Address</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={shippingAddress.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={shippingAddress.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="company">Company (Optional)</Label>
              <Input
                id="company"
                value={shippingAddress.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Your company name"
              />
            </div>

            <div>
              <Label htmlFor="address">Street Address *</Label>
              <Input
                id="address"
                value={shippingAddress.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="123 Main Street"
                className={errors.address ? 'border-red-500' : ''}
              />
              {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="suburb">Suburb *</Label>
                <Input
                  id="suburb"
                  value={shippingAddress.suburb}
                  onChange={(e) => handleInputChange('suburb', e.target.value)}
                  placeholder="Sydney"
                  className={errors.suburb ? 'border-red-500' : ''}
                />
                {errors.suburb && <p className="text-sm text-red-500 mt-1">{errors.suburb}</p>}
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Select value={shippingAddress.state} onValueChange={(value) => handleInputChange('state', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {australianStates.map((state) => (
                      <SelectItem key={state.value} value={state.value}>
                        {state.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="postcode">Postcode *</Label>
                <Input
                  id="postcode"
                  value={shippingAddress.postcode}
                  onChange={(e) => handleInputChange('postcode', e.target.value)}
                  placeholder="2000"
                  maxLength={4}
                  className={errors.postcode ? 'border-red-500' : ''}
                />
                {errors.postcode && <p className="text-sm text-red-500 mt-1">{errors.postcode}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Contact Phone *</Label>
              <Input
                id="phone"
                type="tel"
                value={shippingAddress.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="0400 000 000"
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
            </div>

            <div>
              <Label htmlFor="instructions">Delivery Instructions (Optional)</Label>
              <Textarea
                id="instructions"
                value={shippingAddress.instructions}
                onChange={(e) => handleInputChange('instructions', e.target.value)}
                placeholder="Please leave at front door, ring doorbell, etc."
                rows={2}
              />
            </div>
          </div>

          {/* Material Sheet Optimization and Shipping Calculator */}
          {cart?.items && cart.items.length > 0 && (
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-medium flex items-center space-x-2">
                <Truck className="h-4 w-4" />
                <span>Shipping Calculator & Material Optimization</span>
              </h3>
              
              <EnhancedShippingCalculator
                items={cart.items.map(item => ({
                  id: item.id,
                  cabinetTypeId: item.cabinet_type_id,
                  width_mm: item.width_mm,
                  height_mm: item.height_mm,
                  depth_mm: item.depth_mm,
                  doorStyleId: item.door_style_id,
                  quantity: item.quantity,
                  name: item.cabinet_type?.name || 'Cabinet'
                }))}
                onShippingCalculated={handleShippingCalculated}
                enableMaterialOptimization={true}
              />
            </div>
          )}

          {/* Delivery Options */}
          {postcodeChecked && deliveryOptions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center space-x-2">
                <Truck className="h-4 w-4" />
                <span>Delivery Options</span>
              </h3>

              <RadioGroup value={selectedDelivery} onValueChange={setSelectedDelivery}>
                {deliveryOptions.map((option) => (
                  <div key={option.id} className="space-y-2">
                    <div className="flex items-start space-x-3 p-4 border rounded-lg">
                      <RadioGroupItem 
                        value={option.id} 
                        id={option.id}
                        disabled={!option.availableForPostcode}
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={option.id} className="font-medium">
                            {option.name}
                            {!option.availableForPostcode && (
                              <Badge variant="secondary" className="ml-2">Not Available</Badge>
                            )}
                          </Label>
                          <span className="font-semibold">${option.price}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{option.estimatedDays}</span>
                        </div>
                        
                        {/* Assembly Option */}
                        {option.assemblyAvailable && selectedDelivery === option.id && (
                          <div className="mt-3 p-3 bg-muted rounded-md">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`assembly-${option.id}`}
                                checked={addAssembly}
                                onChange={(e) => setAddAssembly(e.target.checked)}
                                className="rounded border-gray-300"
                              />
                              <Label htmlFor={`assembly-${option.id}`} className="text-sm">
                                Add Professional Assembly (+${option.assemblyPrice})
                              </Label>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Our qualified technicians will assemble your cabinets on-site.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </RadioGroup>

              {errors.delivery && <p className="text-sm text-red-500">{errors.delivery}</p>}

              {/* Delivery Summary */}
              {selectedDelivery && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Delivery Total: ${calculateDeliveryTotal()}</strong>
                  <br />
                  {deliveryOptions.find(opt => opt.id === selectedDelivery)?.estimatedDays}
                  {addAssembly && ' (includes professional assembly)'}
                </AlertDescription>
              </Alert>
              )}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Checking delivery options for your postcode...
              </AlertDescription>
            </Alert>
          )}

          {/* No Postcode Checked */}
          {!postcodeChecked && shippingAddress.postcode && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Please enter a valid 4-digit postcode to see delivery options.
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={!postcodeChecked || !selectedDelivery}>
            Continue to Payment
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};