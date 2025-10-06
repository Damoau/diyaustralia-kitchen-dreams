import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Truck, MapPin, Clock, Info, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useCartMigration } from "@/hooks/useCartMigration";
import { usePostcodeServices } from "@/hooks/usePostcodeServices";

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
  const { checkPostcodeServices, loading: postcodeLoading } = usePostcodeServices();
  
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
  const [assemblyLoading, setAssemblyLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [calculatedShippingCost, setCalculatedShippingCost] = useState<number>(0);
  const [debouncedPostcode, setDebouncedPostcode] = useState<string>('');
  const [assemblyPostcodeMismatch, setAssemblyPostcodeMismatch] = useState<{
    hasMismatch: boolean;
    cartAssemblyPostcodes: string[];
  }>({ hasMismatch: false, cartAssemblyPostcodes: [] });

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

  // Cache for postcode checks to avoid repeated API calls
  const [postcodeCache, setPostcodeCache] = useState<Map<string, any>>(new Map());

  // Show delivery options immediately based on postcode rules
  const showOptionsImmediately = (postcode: string) => {
    const postcodeNum = parseInt(postcode);
    const isMetropolitan = (
      (postcodeNum >= 2000 && postcodeNum <= 2249) || // Sydney
      (postcodeNum >= 3000 && postcodeNum <= 3211) || // Melbourne
      (postcodeNum >= 4000 && postcodeNum <= 4179) || // Brisbane
      (postcodeNum >= 5000 && postcodeNum <= 5199) || // Adelaide
      (postcodeNum >= 6000 && postcodeNum <= 6199) || // Perth
      (postcodeNum >= 7000 && postcodeNum <= 7199)    // Hobart
    );

    const immediateOptions = baseDeliveryOptions.map(option => ({
      ...option,
      availableForPostcode: option.id === 'express' ? isMetropolitan : true,
    }));

    setDeliveryOptions(immediateOptions);
    setPostcodeChecked(true);
  };

  // Check assembly eligibility from database (only for white glove)
  const checkAssemblyEligibility = async (postcode: string) => {
    setAssemblyLoading(true);
    try {
      // Query postcode_zones table directly - Phase 2 optimization
      const services = await checkPostcodeServices(postcode);
      
      if (services) {
        const assemblyEligible = services.assembly_available || false;
        const assemblySurcharges = {
          carcass: services.assembly_carcass_surcharge_pct || 0,
          doors: services.assembly_doors_surcharge_pct || 0,
        };

        setDeliveryOptions(prev => prev.map(option => {
          if (option.assemblyAvailable) {
            let assemblyPrice = option.assemblyPrice;
            if (assemblyEligible && assemblyPrice) {
              const surchargeAmount = (assemblySurcharges.carcass + assemblySurcharges.doors) / 100 * assemblyPrice;
              assemblyPrice = assemblyPrice + surchargeAmount;
            }
            return {
              ...option,
              assemblyAvailable: assemblyEligible,
              assemblyPrice,
            };
          }
          return option;
        }));

        // Cache the result
        setPostcodeCache(prev => new Map(prev).set(postcode, { 
          assemblyEligible, 
          assemblySurcharges 
        }));
      }
    } catch (error) {
      console.log('Assembly check failed:', error);
    } finally {
      setAssemblyLoading(false);
    }
  };

  // Debounce postcode input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPostcode(shippingAddress.postcode);
    }, 300);
    return () => clearTimeout(timer);
  }, [shippingAddress.postcode]);

  // Check for assembly postcode mismatches whenever postcode changes
  useEffect(() => {
    if (debouncedPostcode.length === 4 && cart?.items) {
      const cartAssemblyPostcodes: string[] = [];
      
      // Check all cart items for assembly configuration
      cart.items.forEach((item: any) => {
        if (item.configuration?.assembly?.enabled && item.configuration?.assembly?.postcode) {
          cartAssemblyPostcodes.push(item.configuration.assembly.postcode);
        }
      });

      // Check if delivery postcode matches any assembly postcodes
      const hasMismatch = cartAssemblyPostcodes.length > 0 && 
                          !cartAssemblyPostcodes.includes(debouncedPostcode);

      setAssemblyPostcodeMismatch({
        hasMismatch,
        cartAssemblyPostcodes: [...new Set(cartAssemblyPostcodes)] // Remove duplicates
      });

      if (hasMismatch) {
        console.warn('⚠️ Assembly postcode mismatch detected:', {
          deliveryPostcode: debouncedPostcode,
          assemblyPostcodes: cartAssemblyPostcodes
        });
      }
    } else {
      setAssemblyPostcodeMismatch({ hasMismatch: false, cartAssemblyPostcodes: [] });
    }
  }, [debouncedPostcode, cart?.items]);

  // Show delivery options immediately when postcode is valid
  useEffect(() => {
    if (debouncedPostcode.length === 4) {
      // Check cache first
      if (postcodeCache.has(debouncedPostcode)) {
        const cached = postcodeCache.get(debouncedPostcode);
        showOptionsImmediately(debouncedPostcode);
        // Apply cached assembly data if available
        if (cached.assemblyEligible !== undefined) {
          setDeliveryOptions(prev => prev.map(option => {
            if (option.assemblyAvailable) {
              return {
                ...option,
                assemblyAvailable: cached.assemblyEligible,
              };
            }
            return option;
          }));
        }
      } else {
        showOptionsImmediately(debouncedPostcode);
      }
    } else {
      setPostcodeChecked(false);
      setDeliveryOptions([]);
    }
  }, [debouncedPostcode]);

  // Only check assembly when white glove is selected
  useEffect(() => {
    if (selectedDelivery === 'white-glove' && debouncedPostcode.length === 4) {
      if (!postcodeCache.has(debouncedPostcode)) {
        checkAssemblyEligibility(debouncedPostcode);
      }
    }
  }, [selectedDelivery, debouncedPostcode]);

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

          {/* Assembly Postcode Mismatch Warning */}
          {assemblyPostcodeMismatch.hasMismatch && (
            <Alert variant="destructive" className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Assembly Postcode Mismatch!</strong>
                <p className="mt-1">
                  Your cart contains items with assembly service for postcode(s):{' '}
                  <strong>{assemblyPostcodeMismatch.cartAssemblyPostcodes.join(', ')}</strong>
                </p>
                <p className="mt-1">
                  Your delivery postcode is <strong>{shippingAddress.postcode}</strong>.
                  Assembly service must be delivered to the same postcode where it was configured.
                </p>
                <p className="mt-2 text-sm">
                  Please either:
                  <ul className="list-disc ml-5 mt-1">
                    <li>Update your delivery postcode to match the assembly postcode, or</li>
                    <li>Remove assembly service from your cart items and reconfigure them</li>
                  </ul>
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Removed redundant EnhancedShippingCalculator for performance */}

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
                            {option.id === 'white-glove' && assemblyLoading && (
                              <Badge variant="secondary" className="ml-2">
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                Checking availability...
                              </Badge>
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

          {/* No Postcode Checked */}
          {!postcodeChecked && shippingAddress.postcode && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Please enter a valid 4-digit postcode to see delivery options.
              </AlertDescription>
            </Alert>
          )}

          {/* Assembly Postcode Mismatch Warning */}
          {assemblyPostcodeMismatch.hasMismatch && (
            <Alert variant="destructive">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>⚠️ Assembly Postcode Mismatch!</strong>
                <p className="mt-2">
                  Your cart contains items with assembly service configured for postcode(s):{' '}
                  <strong>{assemblyPostcodeMismatch.cartAssemblyPostcodes.join(', ')}</strong>
                </p>
                <p className="mt-2">
                  Your delivery postcode is <strong>{shippingAddress.postcode}</strong>.
                </p>
                <p className="mt-2 font-medium">
                  Assembly service must be delivered to the same postcode where it was configured.
                </p>
                <div className="mt-3 text-sm">
                  <p className="font-medium mb-1">To resolve this:</p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>Change your delivery postcode to match: {assemblyPostcodeMismatch.cartAssemblyPostcodes.join(' or ')}</li>
                    <li>Or remove assembly from your cart items and reconfigure</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={!postcodeChecked || !selectedDelivery || assemblyPostcodeMismatch.hasMismatch}
          >
            Continue to Payment
          </Button>
          {assemblyPostcodeMismatch.hasMismatch && (
            <p className="text-sm text-destructive text-center -mt-2">
              Please resolve the assembly postcode mismatch before continuing
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
};