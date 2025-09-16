import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AdminShipping = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-4">Shipping Management</h1>
        <p className="text-muted-foreground">Manage shipping rates, carriers, and logistics</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Shipping management interface is under development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Shipping Management Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Carrier Management</h4>
                  <p className="text-sm text-muted-foreground">Configure and manage shipping carriers</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Rate Calculation</h4>
                  <p className="text-sm text-muted-foreground">Dynamic shipping rate calculation</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Tracking Integration</h4>
                  <p className="text-sm text-muted-foreground">Real-time shipment tracking</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Zone Management</h4>
                  <p className="text-sm text-muted-foreground">Configure shipping zones and rates</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminShipping;