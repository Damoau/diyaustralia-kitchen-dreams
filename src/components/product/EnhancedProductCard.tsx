import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Eye, Settings2 } from 'lucide-react';
import { ProductOptionValue, ProductOptionConfig } from './ProductOptionsConfiguration';

interface CabinetType {
  id: string;
  name: string;
  description?: string;
  category?: string;
  width_mm?: number;
  height_mm?: number;
  depth_mm?: number;
  door_count?: number;
  drawer_count?: number;
  image_url?: string;
}

interface EnhancedProductCardProps {
  cabinet: CabinetType;
  options: ProductOptionConfig[];
  values: ProductOptionValue[];
  onViewProduct: (cabinet: CabinetType) => void;
  onConfigureProduct: (cabinet: CabinetType) => void;
}

export const EnhancedProductCard: React.FC<EnhancedProductCardProps> = ({
  cabinet,
  options,
  values,
  onViewProduct,
  onConfigureProduct
}) => {
  // Get card sentence options that should be displayed on the product card
  const cardSentenceOptions = options.filter(opt => opt.type === 'card_sentence');
  const cardSentenceValues = values.filter(v => 
    cardSentenceOptions.some(opt => opt.id === v.optionId) && v.value
  );

  // Calculate total price adjustments
  const totalPriceAdjustment = values.reduce((total, value) => {
    return total + (value.priceAdjustment || 0);
  }, 0);

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
      {cabinet.image_url && (
        <div className="aspect-square overflow-hidden rounded-t-lg">
          <img 
            src={cabinet.image_url} 
            alt={cabinet.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <CardContent className="flex-1 flex flex-col p-4">
        <div className="space-y-3 flex-1">
          <div>
            <h3 className="font-semibold text-lg">{cabinet.name}</h3>
            {cabinet.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {cabinet.description}
              </p>
            )}
          </div>

          {/* Dimensions */}
          {(cabinet.width_mm || cabinet.height_mm || cabinet.depth_mm) && (
            <div className="flex flex-wrap gap-2">
              {cabinet.width_mm && (
                <Badge variant="outline" className="text-xs">
                  W: {cabinet.width_mm}mm
                </Badge>
              )}
              {cabinet.height_mm && (
                <Badge variant="outline" className="text-xs">
                  H: {cabinet.height_mm}mm
                </Badge>
              )}
              {cabinet.depth_mm && (
                <Badge variant="outline" className="text-xs">
                  D: {cabinet.depth_mm}mm
                </Badge>
              )}
            </div>
          )}

          {/* Door/Drawer counts */}
          {(cabinet.door_count || cabinet.drawer_count) && (
            <div className="flex gap-2">
              {cabinet.door_count && cabinet.door_count > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {cabinet.door_count} Door{cabinet.door_count > 1 ? 's' : ''}
                </Badge>
              )}
              {cabinet.drawer_count && cabinet.drawer_count > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {cabinet.drawer_count} Drawer{cabinet.drawer_count > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          )}

          {/* Card Sentence Options */}
          {cardSentenceValues.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                {cardSentenceValues
                  .sort((a, b) => {
                    // Sort by card_display_position if available
                    const optionA = options.find(opt => opt.id === a.optionId);
                    const optionB = options.find(opt => opt.id === b.optionId);
                    return 0; // For now, maintain order
                  })
                  .map((value) => (
                    <div key={value.optionId} className="text-sm text-muted-foreground">
                      {value.value as string}
                    </div>
                  ))}
              </div>
            </>
          )}

          {/* Price adjustment display */}
          {totalPriceAdjustment !== 0 && (
            <div className="mt-2">
              <Badge variant={totalPriceAdjustment > 0 ? "default" : "secondary"}>
                {totalPriceAdjustment > 0 ? '+' : ''}${totalPriceAdjustment} options
              </Badge>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewProduct(cabinet)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          <Button
            size="sm"
            onClick={() => onConfigureProduct(cabinet)}
            className="flex-1"
          >
            <Settings2 className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};