import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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


export const ProductCard: React.FC<ProductCardProps> = ({ 
  cabinet, 
  room, 
  displayCategory, 
  roomCategory, 
  onViewProduct, 
  onConfigureProduct 
}) => {
  const handleConfigureClick = () => {
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
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
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
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};