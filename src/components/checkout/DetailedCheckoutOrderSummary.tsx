import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, Wrench, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/formatPrice';

interface DetailedCheckoutOrderSummaryProps {
  items: any[];
}

/**
 * Displays comprehensive cart item details in checkout sidebar
 * Shows: images, all product options (including hinge configurations),
 * hardware, assembly services, and customer notes
 */
export const DetailedCheckoutOrderSummary: React.FC<DetailedCheckoutOrderSummaryProps> = ({ items }) => {
  return (
    <div className="space-y-4">
      {items.map((item) => {
        const hasHardware = item.hardware_selections && item.hardware_selections.length > 0;
        const hasAssembly = item.configuration?.assembly?.enabled;
        const hasOptions = item.configuration?.productOptions && Object.keys(item.configuration.productOptions).length > 0;
        const hasNotes = item.notes || item.configuration?.notes;

        return (
          <div key={item.id} className="border rounded-lg overflow-hidden bg-card">
            {/* Item Header */}
            <div className="flex gap-3 p-3">
              {/* Image */}
              <div className="w-16 h-16 bg-muted rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                {item.cabinet_type?.product_image_url ? (
                  <img 
                    src={item.cabinet_type.product_image_url} 
                    alt={item.cabinet_type?.name || 'Cabinet'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <Package className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm leading-tight mb-1">
                  {item.cabinet_type?.name || 'Cabinet'}
                </h4>
                <p className="text-xs text-muted-foreground mb-1">
                  {item.width_mm}×{item.height_mm}×{item.depth_mm}mm
                </p>
                <div className="flex flex-wrap gap-1">
                  {item.door_style?.name && (
                    <Badge variant="secondary" className="text-xs h-5">
                      {item.door_style.name}
                    </Badge>
                  )}
                  {item.color?.name && (
                    <Badge variant="outline" className="text-xs h-5">
                      {item.color.name}
                    </Badge>
                  )}
                  {item.finish?.name && (
                    <Badge variant="outline" className="text-xs h-5">
                      {item.finish.name}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-xs text-muted-foreground">×{item.quantity}</p>
                <p className="text-sm font-semibold">{formatCurrency(item.total_price, true)}</p>
              </div>
            </div>

            {/* Expanded Details */}
            {(hasHardware || hasAssembly || hasOptions || hasNotes) && (
              <div className="px-3 pb-3 pt-0 border-t">
                <div className="space-y-2 text-xs mt-2">
                  {/* Product Options (including hinge configurations) */}
                  {hasOptions && (
                    <div>
                      <p className="font-semibold text-muted-foreground mb-1">Options:</p>
                      <div className="pl-2 space-y-0.5">
                        {Object.entries(item.configuration.productOptions).map(([key, value]: [string, any]) => {
                          // Format the display based on value type
                          let displayValue = '';
                          let priceAdjustment = null;

                          if (typeof value === 'object') {
                            displayValue = value.label || value.value || JSON.stringify(value);
                            priceAdjustment = value.price;
                          } else {
                            displayValue = String(value);
                          }

                          return (
                            <div key={key} className="flex justify-between">
                              <span className="text-muted-foreground">
                                {key}: <span className="text-foreground">{displayValue}</span>
                              </span>
                              {priceAdjustment && priceAdjustment > 0 && (
                                <span className="text-primary font-medium">
                                  +{formatCurrency(priceAdjustment)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Hardware */}
                  {hasHardware && (
                    <div>
                      <p className="font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                        <Wrench className="h-3 w-3" />
                        Hardware:
                      </p>
                      <div className="pl-2 space-y-0.5">
                        {item.hardware_selections.map((hw: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-muted-foreground">
                            <span>
                              {hw.hardware_type}: {hw.hardware_products?.name || 'Standard'}
                              {hw.quantity > 1 && ` (×${hw.quantity})`}
                            </span>
                            <span className="font-medium text-foreground">
                              {formatCurrency(hw.total_price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assembly Service */}
                  {hasAssembly && (
                    <div>
                      <p className="font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                        <Wrench className="h-3 w-3" />
                        Assembly:
                      </p>
                      <div className="pl-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            {item.configuration.assembly.type === 'carcass_only' 
                              ? 'Carcass Assembly' 
                              : 'Complete Assembly'}
                          </span>
                          <span className="font-medium text-primary">
                            +{formatCurrency(item.configuration.assembly.price || 0)}
                          </span>
                        </div>
                        {item.configuration.assembly.postcode && (
                          <p className="text-xs text-muted-foreground">
                            Delivery: {item.configuration.assembly.postcode}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Customer Notes */}
                  {hasNotes && (
                    <div>
                      <p className="font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        Notes:
                      </p>
                      <div className="pl-2 text-muted-foreground bg-muted p-2 rounded text-xs">
                        {item.notes || item.configuration?.notes}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
