import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { generateVolumeExample } from '@/lib/volumeCalculator';

export const VolumeCalculationExample: React.FC = () => {
  const exampleText = generateVolumeExample();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Volume Calculation Example
        </CardTitle>
        <CardDescription>
          How cabinet parts are converted to volume for checkout using HMR weight specifications and door styles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This example shows how your current cabinet formulas will calculate volume in the checkout process 
            using weight per square meter from Global Settings (HMR) and Door Styles & Colors.
          </AlertDescription>
        </Alert>
        
        <div className="bg-muted/50 p-4 rounded-lg">
          <pre className="text-sm whitespace-pre-wrap font-mono">
            {exampleText}
          </pre>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p><strong>How it works:</strong></p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Cabinet parts (sides, backs, bottoms) use HMR weight specifications from Global Settings</li>
            <li>Door parts use weight specifications from the selected Door Style</li>
            <li>Area is calculated from your existing width/height formulas</li>
            <li>Volume = Area × Thickness × Weight Factor</li>
            <li>Weight = Area × Weight per sqm × Weight Factor</li>
            <li>These totals are used for shipping calculations and material optimization</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};