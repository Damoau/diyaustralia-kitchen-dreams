import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Mail, Lock, User, Phone, Building } from 'lucide-react';
import { useCheckout, type IdentifyPayload } from '@/hooks/useCheckout';
import { useAuth } from '@/hooks/useAuth';

interface CustomerIdentifyProps {
  checkoutId: string;
  onComplete: (result: any) => void;
}

export const CustomerIdentify = ({ checkoutId, onComplete }: CustomerIdentifyProps) => {
  const [activeTab, setActiveTab] = useState<'guest' | 'login' | 'register'>('guest');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phone: '',
    first_name: '',
    last_name: '',
    company: '',
    abn: '',
    how_heard: '',
    accept_terms: false,
    accept_privacy: false,
    marketing_opt_in: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { identifyCustomer, isLoading, validateEmail, validatePhone } = useCheckout();
  const { user } = useAuth();

  // Skip identify step if already signed in
  React.useEffect(() => {
    if (user) {
      console.log('🔐 User already authenticated, auto-proceeding...');
      // Auto-populate and proceed for signed-in users
      const payload: IdentifyPayload = {
        mode: 'guest', // Treat as guest but with auth
        email: user.email || '',
        phone: '',
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
        consents: {
          terms: true,
          privacy: true,
          marketing: false,
        },
      };

      identifyCustomer(checkoutId, payload).then((result) => {
        console.log('✅ Auto-identify complete:', result);
        onComplete(result);
      });
    }
  }, [user, checkoutId]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation for login/register
    if ((activeTab === 'login' || activeTab === 'register') && !formData.password) {
      newErrors.password = 'Password is required';
    }

    // Phone validation
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid Australian phone number';
    }

    // Name validation
    if (!formData.first_name) {
      newErrors.first_name = 'First name is required';
    }
    if (!formData.last_name) {
      newErrors.last_name = 'Last name is required';
    }

    // Consents validation
    if (!formData.accept_terms) {
      newErrors.accept_terms = 'You must accept the Terms & Conditions';
    }
    if (!formData.accept_privacy) {
      newErrors.accept_privacy = 'You must accept the Privacy Policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const payload: IdentifyPayload = {
      mode: activeTab,
      email: formData.email,
      phone: formData.phone,
      first_name: formData.first_name,
      last_name: formData.last_name,
      company: formData.company,
      abn: formData.abn,
      how_heard: formData.how_heard,
      password: activeTab !== 'guest' ? formData.password : undefined,
      consents: {
        terms: formData.accept_terms,
        privacy: formData.accept_privacy,
        marketing: formData.marketing_opt_in,
      },
    };

    try {
      const result = await identifyCustomer(checkoutId, payload);
      onComplete(result);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  // Don't render if user is already signed in (auto-processing)
  if (user) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing your information...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Who's checking out?</CardTitle>
        <p className="text-muted-foreground text-center">
          Use guest checkout or sign in to find your saved quotes.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="guest">Continue as Guest</TabsTrigger>
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="register">Create Account</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <TabsContent value="guest" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your.email@example.com"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="0400 000 000"
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      placeholder="John"
                      className={errors.first_name ? 'border-red-500' : ''}
                    />
                    {errors.first_name && <p className="text-sm text-red-500 mt-1">{errors.first_name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      placeholder="Smith"
                      className={errors.last_name ? 'border-red-500' : ''}
                    />
                    {errors.last_name && <p className="text-sm text-red-500 mt-1">{errors.last_name}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="company">Company (Optional)</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    placeholder="Your Company Name"
                  />
                </div>

                <div>
                  <Label htmlFor="how_heard">How did you hear about us?</Label>
                  <Select value={formData.how_heard} onValueChange={(value) => handleInputChange('how_heard', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Please select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="search">Google/Search Engine</SelectItem>
                      <SelectItem value="social">Social Media</SelectItem>
                      <SelectItem value="referral">Friend/Family Referral</SelectItem>
                      <SelectItem value="advertisement">Advertisement</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="login" className="space-y-4">
              <div>
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your.email@example.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="••••••••"
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
              </div>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <div>
                <Label htmlFor="register-email">Email *</Label>
                <Input
                  id="register-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your.email@example.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <Label htmlFor="register-password">Password *</Label>
                <Input
                  id="register-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="••••••••"
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="register-first-name">First Name *</Label>
                  <Input
                    id="register-first-name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    placeholder="John"
                    className={errors.first_name ? 'border-red-500' : ''}
                  />
                  {errors.first_name && <p className="text-sm text-red-500 mt-1">{errors.first_name}</p>}
                </div>
                <div>
                  <Label htmlFor="register-last-name">Last Name *</Label>
                  <Input
                    id="register-last-name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    placeholder="Smith"
                    className={errors.last_name ? 'border-red-500' : ''}
                  />
                  {errors.last_name && <p className="text-sm text-red-500 mt-1">{errors.last_name}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="register-phone">Phone Number *</Label>
                <Input
                  id="register-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="0400 000 000"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
              </div>
            </TabsContent>

            {/* Consents Section - shown for all modes */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="accept_terms"
                  checked={formData.accept_terms}
                  onCheckedChange={(checked) => handleInputChange('accept_terms', checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="accept_terms" className="text-sm font-normal">
                    I accept the{' '}
                    <a href="/terms" target="_blank" className="text-primary hover:underline">
                      Terms & Conditions
                    </a>
                    {' '}*
                  </Label>
                </div>
              </div>
              {errors.accept_terms && <p className="text-sm text-red-500">{errors.accept_terms}</p>}

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="accept_privacy"
                  checked={formData.accept_privacy}
                  onCheckedChange={(checked) => handleInputChange('accept_privacy', checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="accept_privacy" className="text-sm font-normal">
                    I accept the{' '}
                    <a href="/privacy" target="_blank" className="text-primary hover:underline">
                      Privacy Policy
                    </a>
                    {' '}*
                  </Label>
                </div>
              </div>
              {errors.accept_privacy && <p className="text-sm text-red-500">{errors.accept_privacy}</p>}

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="marketing_opt_in"
                  checked={formData.marketing_opt_in}
                  onCheckedChange={(checked) => handleInputChange('marketing_opt_in', checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="marketing_opt_in" className="text-sm font-normal">
                    I'd like to receive marketing communications and special offers
                  </Label>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Continue to Shipping'
              )}
            </Button>
          </form>
        </Tabs>
      </CardContent>
    </Card>
  );
};