import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QuoteItem } from '@/hooks/useQuotes';
import { Edit, Trash2, Image } from 'lucide-react';

interface QuoteItemCardProps {
  item: QuoteItem;
  index: number;
  cabinetTypes: any[];
  doorStyles: any[];
  colors: any[];
  finishes: any[];
  onEdit: () => void;
  onRemove: () => void;
}

export const QuoteItemCard = ({ 
  item, 
  index, 
  cabinetTypes, 
  doorStyles, 
  colors, 
  finishes, 
  onEdit, 
  onRemove 
}: QuoteItemCardProps) => {
  // Use related data from the item first, then fallback to lookup
  const cabinetType = item.cabinet_type || cabinetTypes.find(ct => ct.id === item.cabinet_type_id);
  const doorStyle = item.door_style || doorStyles.find(ds => ds.id === item.door_style_id);
  const color = item.color || colors.find(c => c.id === item.color_id);
  const finish = item.finish || finishes.find(f => f.id === item.finish_id);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Cabinet Image */}
          <div className="flex-shrink-0">
            {cabinetType?.product_image_url ? (
              <img 
                src={cabinetType.product_image_url} 
                alt={cabinetType.name}
                className="w-20 h-20 object-cover rounded-md border"
              />
            ) : (
              <div className="w-20 h-20 bg-muted rounded-md border flex items-center justify-center">
                <Image className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Item Details */}
          <div className="flex-1 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-lg">
                  {cabinetType?.name || 'Unknown Cabinet Type'}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {item.width_mm}W × {item.height_mm}H × {item.depth_mm}D mm
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={onEdit}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={onRemove}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Style & Color */}
            <div className="flex flex-wrap gap-2">
              {doorStyle && (
                <Badge variant="secondary">
                  {doorStyle.name}
                </Badge>
              )}
              {color && (
                <Badge variant="outline" className="flex items-center gap-1">
                  {color.hex_code && (
                    <div 
                      className="w-3 h-3 rounded-full border" 
                      style={{ backgroundColor: color.hex_code }}
                    />
                  )}
                  {color.name}
                </Badge>
              )}
              {finish && (
                <Badge variant="outline">
                  {finish.name}
                </Badge>
              )}
            </div>

            {/* Hardware & Production Options */}
            {item.configuration && (
              <div className="flex flex-wrap gap-1 text-xs">
                {item.configuration.production_options?.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    +{item.configuration.production_options.length} Production Options
                  </Badge>
                )}
                {item.configuration.pricing_breakdown?.hardware > 0 && (
                  <Badge variant="outline" className="text-xs">
                    Hardware: ${item.configuration.pricing_breakdown.hardware.toFixed(2)}
                  </Badge>
                )}
              </div>
            )}

            {/* Notes */}
            {item.notes && (
              <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                <strong>Notes:</strong> {item.notes}
              </div>
            )}

            {/* Pricing */}
            <div className="flex justify-between items-center pt-2 border-t">
              <div className="text-sm">
                <span className="text-muted-foreground">Qty:</span> {item.quantity}
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  ${item.unit_price?.toFixed(2) || '0.00'} each
                </div>
                <div className="font-bold">
                  ${item.total_price?.toFixed(2) || '0.00'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};