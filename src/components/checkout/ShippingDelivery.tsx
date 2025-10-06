import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Truck, MapPin, Clock, Info, Loader2, Search } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useCartMigration } from "@/hooks/useCartMigration";
import { usePostcodeServices } from "@/hooks/usePostcodeServices";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const { user } = useAuth();
  
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: customerData?.identity?.first_name || customerData?.customer_first_name || '',
    lastName: customerData?.identity?.last_name || customerData?.customer_last_name || '',
    company: customerData?.customer_company || '',
    address: '',
    suburb: '',
    state: 'NSW',
    postcode: '',
    country: 'Australia',
    phone: customerData?.identity?.phone || customerData?.customer_phone || '',
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
  const [saveAddress, setSaveAddress] = useState<boolean>(false);
  const [addressSearchQuery, setAddressSearchQuery] = useState<string>('');
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [searchingAddress, setSearchingAddress] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

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

  // AI Address Search with Mapbox
  const searchAddress = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    setSearchingAddress(true);
    try {
      // Using Mapbox public token - replace with your token in production
      const mapboxToken = 'pk.eyJ1IjoibGF1cmVubmV2ZSIsImEiOiJjbThjZTdsYWQwZGc5MmpwdmoyM2diaTRwIn0.hANZgSe5aTG8O8AhzWSp5A';
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `country=AU&types=address&limit=5&access_token=${mapboxToken}`
      );
      
      const data = await response.json();
      setAddressSuggestions(data.features || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Address search error:', error);
    } finally {
      setSearchingAddress(false);
    }
  };

  // Debounce address search
  useEffect(() => {
    if (!addressSearchQuery) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(() => {
      searchAddress(addressSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [addressSearchQuery]);

  const selectAddressSuggestion = (suggestion: any) => {
    // Parse Mapbox address components
    const context = suggestion.context || [];
    const postcode = context.find((c: any) => c.id.startsWith('postcode'))?.text || '';
    const suburb = context.find((c: any) => c.id.startsWith('place'))?.text || '';
    const state = context.find((c: any) => c.id.startsWith('region'))?.short_code?.split('-')[1] || 'NSW';

    setShippingAddress(prev => ({
      ...prev,
      address: suggestion.address ? `${suggestion.address} ${suggestion.text}` : suggestion.place_name.split(',')[0],
      suburb: suburb,
      state: state.toUpperCase(),
      postcode: postcode,
    }));

    setAddressSearchQuery('');
    setShowSuggestions(false);
    setAddressSuggestions([]);
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
      // Assembly object presence means assembly is enabled
      cart.items.forEach((item: any) => {
        if (item.configuration?.assembly && item.configuration.assembly.postcode) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Save address if user is logged in and checkbox is checked
    if (user && saveAddress) {
      try {
        const { error } = await supabase
          .from('addresses')
          .insert({
            user_id: user.id,
            name: `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim(),
            line1: shippingAddress.address,
            line2: shippingAddress.company || null,
            suburb: shippingAddress.suburb,
            state: shippingAddress.state,
            postcode: shippingAddress.postcode,
            country: shippingAddress.country,
            phone: shippingAddress.phone,
            is_default: false,
            type: 'shipping',
          });

        if (error) {
          console.error('Error saving address:', error);
          toast.error('Address saved to checkout but failed to save for future use');
        } else {
          toast.success('Address saved for future orders!');
        }
      } catch (error) {
        console.error('Error saving address:', error);
      }
    }

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
            
            <div>
              <Label htmlFor="company">Company (Optional)</Label>
              <Input
                id="company"
                value={shippingAddress.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Your company name"
              />
            </div>

            {/* AI Address Search */}
            <div className="relative">
              <Label htmlFor="addressSearch">Search Address *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="addressSearch"
                  value={addressSearchQuery}
                  onChange={(e) => setAddressSearchQuery(e.target.value)}
                  placeholder="Start typing your address..."
                  className="pl-10"
                />
                {searchingAddress && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              
              {/* Address Suggestions Dropdown */}
              {showSuggestions && addressSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                  {addressSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground transition-colors"
                      onClick={() => selectAddressSuggestion(suggestion)}
                    >
                      <div className="text-sm font-medium">{suggestion.text}</div>
                      <div className="text-xs text-muted-foreground">{suggestion.place_name}</div>
                    </button>
                  ))}
                </div>
              )}
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
              <p className="text-xs text-muted-foreground mt-1">Or use the search above to auto-fill</p>
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

            {/* Save Address Checkbox (only for logged-in users) */}
            {user && (
              <div className="flex items-start space-x-2 p-4 border rounded-md bg-accent/10">
                <Checkbox
                  id="saveAddress"
                  checked={saveAddress}
                  onCheckedChange={(checked) => setSaveAddress(checked as boolean)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label 
                    htmlFor="saveAddress" 
                    className="text-sm font-medium cursor-pointer"
                  >
                    Save this address for future orders
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    We'll securely store this address in your account for faster checkout next time.
                  </p>
                </div>
              </div>
            )}
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