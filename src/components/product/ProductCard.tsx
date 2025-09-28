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
    <Card 
      className="group hover:shadow-lg transition-all duration-300 overflow-hidden h-full flex flex-col cursor-pointer"
      onClick={handleConfigureClick}
    >
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
            <span className="text-muted-foreground text-xs sm:text-sm">No image available</span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1">
        <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6 flex-1">
          <div className="space-y-2 text-center">
            <CardTitle className="text-sm sm:text-lg font-semibold leading-tight line-clamp-2">
              {cabinet.name}
            </CardTitle>
            {(cabinet.door_count > 0 || cabinet.drawer_count > 0) && (
              <div className="flex flex-wrap gap-1 justify-center">
                {cabinet.door_count > 0 && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {cabinet.door_count} Door{cabinet.door_count !== 1 ? "s" : ""}
                  </Badge>
                )}
                {cabinet.drawer_count > 0 && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {cabinet.drawer_count} Drawer{cabinet.drawer_count !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0 px-3 sm:px-6 pb-3 sm:pb-6 mt-auto">
          <Button 
            className="w-full text-xs sm:text-sm font-medium py-2 sm:py-2.5"
            size="sm"
          >
            Create your cabinet
          </Button>
        </CardContent>
      </div>
    </Card>
  );
};