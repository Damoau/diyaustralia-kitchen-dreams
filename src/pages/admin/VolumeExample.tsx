import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, Package, Truck } from 'lucide-react';
import { VolumeCalculationExample } from '@/components/admin/VolumeCalculationExample';

export default function VolumeExample() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Volume Calculation System</h1>
          <p className="text-muted-foreground">
            How cabinet formulas calculate volume for checkout using HMR and door style specifications
          </p>
        </div>
        <Button variant="outline" onClick={() => window.history.back()}>
          ← Back to Settings
        </Button>
      </div>

      <div className="grid gap-6">
        <VolumeCalculationExample />
        
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="h-5 w-5" />
                Formula System
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Your existing cabinet part formulas calculate area from dimensions. The new system multiplies this by weight per sqm and thickness to get volume.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5" />
                Material Sources
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>HMR carcass parts use Global Settings specifications. Door parts use Door Style specifications for accurate volume calculations.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Truck className="h-5 w-5" />
                Checkout Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>The calculated volume and weight are used for shipping quotes, material optimization, and packaging requirements during checkout.</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Implementation Status</CardTitle>
            <CardDescription>
              Current progress on the volume calculation system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">✅ Assembly options moved to Parts & Formulas tab</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">✅ Material specifications updated with weight_per_sqm field</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">✅ Door styles already have weight per sqm specifications</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">✅ Volume calculation library created</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm">🔄 Ready to integrate into checkout process</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}