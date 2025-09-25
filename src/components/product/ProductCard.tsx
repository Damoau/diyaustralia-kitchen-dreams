import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calculator, MapPin, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

// Input validation schema
const postcodeSchema = z.string()
  .trim()
  .regex(/^\d{4}$/, "Postcode must be 4 digits")
  .length(4, "Postcode must be exactly 4 digits");

interface CabinetType {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  short_description?: string;
  product_image_url?: string;
  default_width_mm: number;
  default_height_mm: number;
  default_depth_mm: number;
  door_count: number;
  drawer_count: number;
  url_slug?: string;
}

interface ProductCardProps {
  cabinet: CabinetType;
  room?: string;
  displayCategory?: string;
  roomCategory?: any;
  onViewProduct: (cabinet: CabinetType) => void;
  onConfigureProduct: (cabinet: CabinetType) => void;
}

interface AssemblyEstimate {
  eligible: boolean;
  price?: number;
  lead_time_days?: number;
  includes?: string[];
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  cabinet, 
  room, 
  displayCategory, 
  roomCategory, 
  onViewProduct, 
  onConfigureProduct 
}) => {
  const [postcode, setPostcode] = useState("");
  const [postcodeError, setPostcodeError] = useState("");
  const [assemblyEnabled, setAssemblyEnabled] = useState(false);
  const [assemblyEstimate, setAssemblyEstimate] = useState<AssemblyEstimate | null>(null);

  // Calculate cabinet surface area for assembly pricing
  const cabinetSurfaceArea = 
    ((cabinet.default_width_mm * cabinet.default_height_mm * 2) + 
     (cabinet.default_width_mm * cabinet.default_depth_mm * 4) +
     (cabinet.default_height_mm * cabinet.default_depth_mm * 2)) / 1000000; // m²

  // Mock postcode lookup - this would connect to your postcode zones table
  const { data: postcodeData } = useQuery({
    queryKey: ['postcode-lookup', postcode],
    queryFn: async () => {
      if (!postcode || postcode.length !== 4) return null;
      
      // Mock postcode data - replace with actual Supabase query
      const mockData: Record<string, any> = {
        '3000': { postcode: '3000', state: 'VIC', zone: 'MEL_METRO', metro: true, assembly_eligible: true, assembly_price_per_cabinet: 150 },
        '3001': { postcode: '3001', state: 'VIC', zone: 'MEL_METRO', metro: true, assembly_eligible: true, assembly_price_per_cabinet: 150 },
        '4000': { postcode: '4000', state: 'QLD', zone: 'BNE_METRO', metro: true, assembly_eligible: true, assembly_price_per_cabinet: 165 },
        '2000': { postcode: '2000', state: 'NSW', zone: 'SYD_METRO', metro: true, assembly_eligible: true, assembly_price_per_cabinet: 175 },
        '6000': { postcode: '6000', state: 'WA', zone: 'PER_METRO', metro: true, assembly_eligible: false, assembly_price_per_cabinet: 0 },
      };
      
      return mockData[postcode] || null;
    },
    enabled: postcode.length === 4,
  });

  // Calculate assembly estimate when postcode changes
  useEffect(() => {
    if (postcodeData) {
      setAssemblyEstimate({
        eligible: postcodeData.assembly_eligible,
        price: postcodeData.assembly_eligible ? postcodeData.assembly_price_per_cabinet : undefined,
        lead_time_days: postcodeData.assembly_eligible ? 8 : undefined,
        includes: postcodeData.assembly_eligible ? [
          'Professional installation',
          'Hardware attachment', 
          'Adjustment and alignment',
          '12-month warranty'
        ] : undefined
      });
    }
  }, [postcodeData]);

  // Handle postcode input with validation
  const handlePostcodeChange = (value: string) => {
    setPostcode(value);
    setPostcodeError("");
    
    // Clear assembly estimate while typing
    if (value.length !== 4) {
      setAssemblyEstimate(null);
    }

    // Validate postcode format
    if (value.length === 4) {
      try {
        postcodeSchema.parse(value);
      } catch (error) {
        if (error instanceof z.ZodError) {
          setPostcodeError(error.errors[0].message);
        }
      }
    }
  };

  const handleConfigureClick = () => {
    // Pass assembly options to configurator if enabled
    const configOptions = {
      postcode: postcode || undefined,
      assemblyEnabled,
      assemblyEstimate: assemblyEstimate || undefined
    };
    
    onConfigureProduct(cabinet);
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="aspect-square relative overflow-hidden">
        {cabinet.product_image_url ? (
          <img
            src={cabinet.product_image_url}
            alt={`${cabinet.name} - ${displayCategory} ${roomCategory?.display_name || ''}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-secondary/50 flex items-center justify-center">
            <span className="text-muted-foreground">No image available</span>
          </div>
        )}
      </div>

      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg leading-tight">{cabinet.name}</CardTitle>
          {(cabinet.door_count > 0 || cabinet.drawer_count > 0) && (
            <div className="flex gap-1 shrink-0">
              {cabinet.door_count > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {cabinet.door_count} Door{cabinet.door_count !== 1 ? 's' : ''}
                </Badge>
              )}
              {cabinet.drawer_count > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {cabinet.drawer_count} Drawer{cabinet.drawer_count !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          )}
        </div>
        {cabinet.short_description && (
          <p className="text-sm text-muted-foreground">
            {cabinet.short_description}
          </p>
        )}
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Dimensions */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="text-center p-2 bg-secondary/50 rounded">
            <div className="font-medium">{cabinet.default_width_mm}mm</div>
            <div className="text-xs text-muted-foreground">Width</div>
          </div>
          <div className="text-center p-2 bg-secondary/50 rounded">
            <div className="font-medium">{cabinet.default_height_mm}mm</div>
            <div className="text-xs text-muted-foreground">Height</div>
          </div>
          <div className="text-center p-2 bg-secondary/50 rounded">
            <div className="font-medium">{cabinet.default_depth_mm}mm</div>
            <div className="text-xs text-muted-foreground">Depth</div>
          </div>
        </div>

        {/* Postcode Input */}
        <div className="space-y-2">
          <Label htmlFor={`postcode-${cabinet.id}`} className="flex items-center gap-2 text-xs">
            <MapPin className="h-3 w-3" />
            Postcode for Assembly
          </Label>
          <Input
            id={`postcode-${cabinet.id}`}
            value={postcode}
            onChange={(e) => handlePostcodeChange(e.target.value)}
            placeholder="e.g., 3000"
            maxLength={4}
            className={`text-sm h-8 ${postcodeError ? "border-destructive" : ""}`}
          />
          {postcodeError && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {postcodeError}
            </p>
          )}
        </div>

        {/* Assembly Service */}
        {assemblyEstimate && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="h-3 w-3" />
                <Label htmlFor={`assembly-${cabinet.id}`} className="text-xs font-medium">
                  Assembly Service
                </Label>
              </div>
              <Switch
                id={`assembly-${cabinet.id}`}
                checked={assemblyEnabled}
                onCheckedChange={setAssemblyEnabled}
                disabled={!assemblyEstimate.eligible}
              />
            </div>

            {assemblyEstimate.eligible ? (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Professional assembly</span>
                  <Badge variant={assemblyEnabled ? "default" : "secondary"} className="text-xs">
                    ${assemblyEstimate.price?.toFixed(2)}
                  </Badge>
                </div>
                
                {assemblyEnabled && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Lead time: {assemblyEstimate.lead_time_days} days</p>
                    <div className="space-y-0.5">
                      <p className="font-medium">Includes:</p>
                      {assemblyEstimate.includes?.map((item, index) => (
                        <p key={index} className="ml-2">• {item}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="h-3 w-3" />
                <span className="text-xs">Assembly not available in this area</span>
              </div>
            )}
          </div>
        )}

        {/* No Assembly Data Yet */}
        {postcode.length === 4 && !assemblyEstimate && !postcodeError && (
          <div className="text-xs text-muted-foreground text-center py-2">
            Checking assembly availability...
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={() => onViewProduct(cabinet)}
            variant="outline"
            className="flex-1"
            size="sm"
          >
            View Details
          </Button>
          <Button 
            onClick={handleConfigureClick}
            className="flex-1"
            size="sm"
          >
            Configure
            {assemblyEnabled && assemblyEstimate?.price && (
              <span className="ml-1">
                +${assemblyEstimate.price.toFixed(0)}
              </span>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};