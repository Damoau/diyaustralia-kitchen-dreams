import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, FileText, Lock, Info } from 'lucide-react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  requiresDetails: boolean;
}

interface PaymentStepProps {
  checkoutId: string;
  onComplete: (data: any) => void;
  orderSummary: {
    subtotal: number;
    deliveryTotal: number;
    taxAmount: number;
    finalTotal: number;
  };
}

export const PaymentStep = ({ checkoutId, onComplete, orderSummary }: PaymentStepProps) => {
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [billingAddress, setBillingAddress] = useState({
    firstName: '',
    lastName: '',
    company: '',
    address: '',
    suburb: '',
    state: 'NSW',
    postcode: '',
    abn: '',
  });
  const [sameAsShipping, setSameAsShipping] = useState<boolean>(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      description: 'Direct bank transfer - Invoice will be sent after order confirmation',
      icon: <Building className="h-5 w-5" />,
      requiresDetails: false,
    },
    {
      id: 'quote_request',
      name: 'Request Custom Quote',
      description: 'Get a detailed quote with custom pricing and payment terms',
      icon: <FileText className="h-5 w-5" />,
      requiresDetails: false,
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'Pay securely with your PayPal account or credit card',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.79A.859.859 0 0 1 5.8 2h8.771c3.066 0 5.216 1.31 5.216 4.385 0 3.06-2.15 4.396-5.216 4.396h-3.06l-.843 4.478h2.41c.75 0 1.321-.602 1.482-1.34l.181-.97h2.79l-.302 1.628c-.362 1.94-1.928 3.32-3.95 3.32H7.076z"/>
        </svg>
      ),
      requiresDetails: true,
    },
  ];

  const handleInputChange = (field: string, value: string) => {
    setBillingAddress(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedPayment) {
      newErrors.payment = 'Please select a payment method';
    }

    // Only validate billing address if different from shipping
    if (!sameAsShipping) {
      if (!billingAddress.firstName.trim()) {
        newErrors.firstName = 'First name is required';
      }
      if (!billingAddress.lastName.trim()) {
        newErrors.lastName = 'Last name is required';
      }
      if (!billingAddress.address.trim()) {
        newErrors.address = 'Address is required';
      }
      if (!billingAddress.suburb.trim()) {
        newErrors.suburb = 'Suburb is required';
      }
      if (!billingAddress.postcode.trim()) {
        newErrors.postcode = 'Postcode is required';
      } else if (!/^\d{4}$/.test(billingAddress.postcode)) {
        newErrors.postcode = 'Postcode must be 4 digits';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const paymentData = {
      paymentMethod: selectedPayment,
      billingAddress: sameAsShipping ? null : billingAddress,
      sameAsShipping,
      orderSummary,
    };

    onComplete(paymentData);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.79A.859.859 0 0 1 5.8 2h8.771c3.066 0 5.216 1.31 5.216 4.385 0 3.06-2.15 4.396-5.216 4.396h-3.06l-.843 4.478h2.41c.75 0 1.321-.602 1.482-1.34l.181-.97h2.79l-.302 1.628c-.362 1.94-1.928 3.32-3.95 3.32H7.076z"/>
          </svg>
          <span>Payment Method</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Methods */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Choose Payment Method</h3>
            
            <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment}>
              {paymentMethods.map((method) => (
                <div key={method.id} className="space-y-2">
                  <div className="flex items-start space-x-3 p-4 border rounded-lg">
                    <RadioGroupItem value={method.id} id={method.id} />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-2">
                        {method.icon}
                        <Label htmlFor={method.id} className="font-medium">
                          {method.name}
                        </Label>
                        {method.id === 'bank_transfer' && (
                          <Badge variant="secondary">Most Popular</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </div>
                  </div>

                  {/* Payment Method Specific Content */}
                  {selectedPayment === method.id && (
                    <div className="ml-6 p-4 bg-muted rounded-md">
                      {method.id === 'bank_transfer' && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Info className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium">Bank Transfer Details</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            After confirming your order, you'll receive an invoice with our bank details and payment instructions. 
                            Your order will be processed once payment is received (typically 1-2 business days).
                          </p>
                          <div className="bg-background p-3 rounded border text-sm">
                            <p><strong>Payment Terms:</strong> Net 30 days</p>
                            <p><strong>Processing:</strong> Orders ship after payment confirmation</p>
                          </div>
                        </div>
                      )}

                      {method.id === 'quote_request' && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium">Custom Quote Process</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Perfect for large orders or custom requirements. Our team will prepare a detailed quote with:
                          </p>
                          <ul className="text-sm text-muted-foreground list-disc list-inside ml-4 space-y-1">
                            <li>Volume discounts for large quantities</li>
                            <li>Custom sizing and modifications</li>
                            <li>Flexible payment terms</li>
                            <li>Project timeline planning</li>
                          </ul>
                          <div className="bg-background p-3 rounded border text-sm">
                            <p><strong>Response Time:</strong> 1-2 business days</p>
                            <p><strong>Quote Validity:</strong> 30 days</p>
                          </div>
                        </div>
                      )}

                      {method.id === 'paypal' && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Lock className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium">Secure PayPal Payment</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Pay instantly with your PayPal account or credit card. Your payment information is encrypted and secure.
                          </p>
                          <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                              PayPal payments are available for orders under $5,000. 
                              For larger orders, please choose bank transfer or request a quote.
                            </AlertDescription>
                          </Alert>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </RadioGroup>

            {errors.payment && <p className="text-sm text-red-500">{errors.payment}</p>}
          </div>

          {/* Billing Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Billing Address</h3>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sameAsShipping"
                checked={sameAsShipping}
                onChange={(e) => setSameAsShipping(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="sameAsShipping" className="text-sm">
                Same as shipping address
              </Label>
            </div>

            {!sameAsShipping && (
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="billFirstName">First Name *</Label>
                    <Input
                      id="billFirstName"
                      value={billingAddress.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={errors.firstName ? 'border-red-500' : ''}
                    />
                    {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="billLastName">Last Name *</Label>
                    <Input
                      id="billLastName"
                      value={billingAddress.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={errors.lastName ? 'border-red-500' : ''}
                    />
                    {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="billCompany">Company (Optional)</Label>
                  <Input
                    id="billCompany"
                    value={billingAddress.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    placeholder="Your company name"
                  />
                </div>

                <div>
                  <Label htmlFor="billAddress">Address *</Label>
                  <Input
                    id="billAddress"
                    value={billingAddress.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="123 Main Street"
                    className={errors.address ? 'border-red-500' : ''}
                  />
                  {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="billSuburb">Suburb *</Label>
                    <Input
                      id="billSuburb"
                      value={billingAddress.suburb}
                      onChange={(e) => handleInputChange('suburb', e.target.value)}
                      placeholder="Sydney"
                      className={errors.suburb ? 'border-red-500' : ''}
                    />
                    {errors.suburb && <p className="text-sm text-red-500 mt-1">{errors.suburb}</p>}
                  </div>
                  <div>
                    <Label htmlFor="billState">State *</Label>
                    <Select value={billingAddress.state} onValueChange={(value) => handleInputChange('state', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NSW">New South Wales</SelectItem>
                        <SelectItem value="VIC">Victoria</SelectItem>
                        <SelectItem value="QLD">Queensland</SelectItem>
                        <SelectItem value="WA">Western Australia</SelectItem>
                        <SelectItem value="SA">South Australia</SelectItem>
                        <SelectItem value="TAS">Tasmania</SelectItem>
                        <SelectItem value="ACT">Australian Capital Territory</SelectItem>
                        <SelectItem value="NT">Northern Territory</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="billPostcode">Postcode *</Label>
                    <Input
                      id="billPostcode"
                      value={billingAddress.postcode}
                      onChange={(e) => handleInputChange('postcode', e.target.value)}
                      placeholder="2000"
                      maxLength={4}
                      className={errors.postcode ? 'border-red-500' : ''}
                    />
                    {errors.postcode && <p className="text-sm text-red-500 mt-1">{errors.postcode}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="abn">ABN (Optional - for tax invoice)</Label>
                  <Input
                    id="abn"
                    value={billingAddress.abn}
                    onChange={(e) => handleInputChange('abn', e.target.value)}
                    placeholder="12 345 678 901"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Provide your ABN if you need a tax invoice for business purposes
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <h3 className="text-lg font-medium">Order Total</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${orderSummary.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery & Assembly</span>
                <span>${orderSummary.deliveryTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (10%)</span>
                <span>${orderSummary.taxAmount.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>${orderSummary.finalTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full">
            Continue to Review Order
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};