import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, Package, MapPin, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface ShipmentEvent {
  id: string;
  tracking_number: string;
  carrier: string;
  status: string;
  event_description: string;
  event_date: string;
  location?: string;
  created_at: string;
}

interface ShippingTrackerProps {
  orderId: string;
}

export const ShippingTracker = ({ orderId }: ShippingTrackerProps) => {
  const [events, setEvents] = useState<ShipmentEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShipmentEvents();
  }, [orderId]);

  const loadShipmentEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('shipment_events')
        .select('*')
        .eq('order_id', orderId)
        .order('event_date', { ascending: false });

      if (error) throw error;

      // Map the database fields to our interface
      const mappedEvents = (data || []).map(event => ({
        id: event.id,
        tracking_number: event.tracking_number,
        carrier: event.carrier,
        status: event.event_type, // Map event_type to status
        event_description: event.description, // Map description to event_description
        event_date: event.event_date,
        location: event.location,
        created_at: event.created_at
      }));

      setEvents(mappedEvents);
    } catch (error: any) {
      console.error('Error loading shipment events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'picked_up': 'default',
      'in_transit': 'default',
      'out_for_delivery': 'default',
      'delivered': 'default',
      'exception': 'destructive',
      'returned': 'destructive'
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'picked_up':
        return <Package className="h-4 w-4" />;
      case 'in_transit':
        return <Truck className="h-4 w-4" />;
      case 'out_for_delivery':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <Package className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading shipping information...</p>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No shipping information available yet. We'll update this section once your order ships.
          </p>
        </CardContent>
      </Card>
    );
  }

  const latestEvent = events[0];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Tracking Number</p>
                <p className="text-sm text-muted-foreground">{latestEvent.tracking_number}</p>
              </div>
              <div>
                <p className="font-medium">Carrier</p>
                <p className="text-sm text-muted-foreground">{latestEvent.carrier}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Current Status</p>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusIcon(latestEvent.status)}
                  {getStatusBadge(latestEvent.status)}
                </div>
              </div>
              <div>
                <p className="font-medium">Last Updated</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(latestEvent.event_date), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tracking History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.map((event, index) => (
              <div key={event.id} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(event.status)}
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusBadge(event.status)}
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(event.event_date), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm">{event.event_description}</p>
                  {event.location && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};