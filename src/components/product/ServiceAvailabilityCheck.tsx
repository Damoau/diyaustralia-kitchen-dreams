import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Truck, Wrench, Package } from 'lucide-react';
import { usePostcodeServices } from '@/hooks/usePostcodeServices';

interface ServiceAvailabilityCheckProps {
  onServiceSelect?: (services: any) => void;
  className?: string;
}

export const ServiceAvailabilityCheck: React.FC<ServiceAvailabilityCheckProps> = ({
  onServiceSelect,
  className = '',
}) => {
  const [postcodeInput, setPostcodeInput] = useState('');
  const { checkPostcodeServices, currentServices, loading, error } = usePostcodeServices();

  const handleCheckPostcode = async () => {
    const services = await checkPostcodeServices(postcodeInput);
    if (services && onServiceSelect) {
      onServiceSelect(services);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(price);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Check Service Availability
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter your postcode (e.g., 2000)"
              value={postcodeInput}
              onChange={(e) => setPostcodeInput(e.target.value)}
              maxLength={4}
              className="flex-1"
            />
            <Button
              onClick={handleCheckPostcode}
              disabled={loading || postcodeInput.length < 4}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check'}
            </Button>
          </div>

          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          {currentServices && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <div>
                  <h3 className="font-semibold">
                    {currentServices.postcode}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Service Area
                  </p>
                </div>
                <Badge variant="default">
                  Serviced Area
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Flat Pack Service */}
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <h4 className="font-medium">Flat Pack</h4>
                      <p className="text-sm text-muted-foreground">
                        Self-assembly required
                      </p>
                    </div>
                    <Badge variant="default">Available</Badge>
                  </div>
                </Card>

                {/* Assembly Service */}
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <Wrench className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <h4 className="font-medium">Assembly Service</h4>
                      <p className="text-sm text-muted-foreground">
                        {currentServices.assembly_available
                          ? `${formatPrice(150)} per cabinet base + surcharges`
                          : 'Not available in your area'}
                      </p>
                    </div>
                    <Badge
                      variant={currentServices.assembly_available ? 'default' : 'secondary'}
                    >
                      {currentServices.assembly_available ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>
                </Card>

                {/* Depot Delivery */}
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <h4 className="font-medium">Depot Delivery</h4>
                      <p className="text-sm text-muted-foreground">
                        {currentServices.depot_delivery_available
                          ? 'Pick up from local depot'
                          : 'Not available in your area'}
                      </p>
                    </div>
                    <Badge
                      variant={currentServices.depot_delivery_available ? 'default' : 'secondary'}
                    >
                      {currentServices.depot_delivery_available ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>
                </Card>

                {/* Home Delivery */}
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <h4 className="font-medium">Home Delivery</h4>
                      <p className="text-sm text-muted-foreground">
                        {currentServices.door_delivery_available
                          ? 'Direct to your door'
                          : 'Not available in your area'}
                      </p>
                    </div>
                    <Badge
                      variant={currentServices.door_delivery_available ? 'default' : 'secondary'}
                    >
                      {currentServices.door_delivery_available ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>
                </Card>
              </div>

              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">
                  <strong>Lead Time:</strong> {currentServices.assembly_lead_time_days || 14} business days
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};