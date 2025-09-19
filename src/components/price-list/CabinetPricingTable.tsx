import { useDynamicPricing } from '@/hooks/useDynamicPricing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Loader2 } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useState } from 'react';

interface CabinetPricingTableProps {
  cabinet: {
    id: string;
    name: string;
  };
  onImageEnlarge?: (image: { url: string; name: string }) => void;
  selectedDoorStyleFilter?: string;
}

export const CabinetPricingTable = ({ cabinet, onImageEnlarge, selectedDoorStyleFilter }: CabinetPricingTableProps) => {
  const [enlargedImage, setEnlargedImage] = useState<{ url: string; name: string } | null>(null);
  
  // Use the same dynamic pricing hook as the configurator - need to pass a valid hardware brand ID
  const {
    cabinetType,
    priceRanges,
    cabinetTypeFinishes,
    isLoading,
    calculateCustomPrice
  } = useDynamicPricing({
    cabinetTypeId: cabinet.id,
    refreshInterval: 30000 // Refresh every 30 seconds to keep data up-to-date
  });

  const handleImageClick = (imageUrl: string, doorStyleName: string) => {
    const imageData = { url: imageUrl, name: doorStyleName };
    setEnlargedImage(imageData);
    onImageEnlarge?.(imageData);
  };

  // Extract unique door styles from finishes
  const doorStyles = cabinetTypeFinishes?.reduce((acc, finish) => {
    if (finish.door_style && !acc.find(ds => ds.id === finish.door_style.id)) {
      acc.push(finish.door_style);
    }
    return acc;
  }, [] as any[]) || [];

  // Filter door styles and finishes based on mobile selection
  const filteredDoorStyles = selectedDoorStyleFilter && selectedDoorStyleFilter !== 'all' 
    ? doorStyles.filter(style => style.name.toLowerCase().includes(selectedDoorStyleFilter.toLowerCase()))
    : doorStyles;

  const filteredFinishes = selectedDoorStyleFilter && selectedDoorStyleFilter !== 'all'
    ? cabinetTypeFinishes?.filter(finish => 
        finish.door_style && filteredDoorStyles.some(ds => ds.id === finish.door_style.id)
      )
    : cabinetTypeFinishes;

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardHeader className="text-center border-b">
          <CardTitle className="text-4xl font-bold">{cabinet.name}</CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading pricing data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!cabinetType || !cabinetTypeFinishes?.length) {
    return (
      <Card className="mb-8">
        <CardHeader className="text-center border-b">
          <CardTitle className="text-4xl font-bold">{cabinet.name}</CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <Package className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">
            No pricing data available for {cabinet.name}
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card className="space-y-0 mb-8">
      {/* Cabinet Name Header */}
      <CardHeader className="text-center">
        <CardTitle className="text-4xl font-bold">
          {cabinet.name}
        </CardTitle>
      </CardHeader>
      
      {/* Door Style Finishes Carousel */}
      {filteredFinishes && filteredFinishes.length > 0 && (
        <div>
          <CardContent className="pb-6">
            <Carousel className="w-full" opts={{ loop: true }}>
              <CarouselContent className="-ml-2 md:-ml-4">
                {filteredFinishes.map((finish: any) => (
                  <CarouselItem key={finish.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                    <Card 
                      className="cursor-pointer transition-all duration-200 hover:shadow-md hover:ring-1 hover:ring-primary/50 overflow-hidden hover-scale"
                      onClick={() => finish.image_url && handleImageClick(finish.image_url, finish.door_style?.name || 'Door Style')}
                    >
                      <div className="relative aspect-[4/3] w-full">
                        {finish.image_url ? (
                          <img 
                            src={finish.image_url} 
                            alt={finish.door_style?.name || 'Door Style'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Package className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <h3 className="font-semibold text-center text-sm text-black drop-shadow-md">
                            {finish.door_style?.name}
                          </h3>
                        </div>
                      </div>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </CardContent>
        </div>
      )}

      {/* Pricing Table with Correct Layout - Door Styles as Columns, Sizes as Rows */}
      <div>
        <CardContent>
          {filteredDoorStyles.length > 0 && priceRanges && priceRanges.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-3 bg-muted font-semibold border">Size Range</th>
                    {filteredDoorStyles.map((doorStyle) => (
                      <th key={doorStyle.id} className="text-center p-3 bg-muted font-semibold border min-w-32">
                        {doorStyle.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {priceRanges.map((range: any) => (
                    <tr key={range.id} className="hover:bg-muted/50">
                      <td className="p-3 font-medium border">
                        <div className="text-sm font-semibold">{range.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {range.min_width_mm}mm - {range.max_width_mm}mm
                        </div>
                      </td>
                      {filteredDoorStyles.map((doorStyle) => {
                        // Find the finish that matches this door style
                        const finish = cabinetTypeFinishes?.find(f => f.door_style?.id === doorStyle.id);
                        
                        if (!finish) {
                          return (
                            <td key={doorStyle.id} className="p-3 text-center border text-muted-foreground">
                              -
                            </td>
                          );
                        }

                        // Calculate price using the maximum width of the range and default height/depth
                        const maxWidth = range.max_width_mm;
                        
                        try {
                          const price = calculateCustomPrice({
                            width: maxWidth,
                            height: cabinetType.default_height_mm,
                            depth: cabinetType.default_depth_mm,
                            doorStyleId: doorStyle.id,
                            colorId: finish.color?.id,
                            quantity: 1
                          });

                          return (
                            <td key={doorStyle.id} className="p-3 text-center border">
                              <div className="font-semibold text-primary">
                                {formatPrice(price)}
                              </div>
                            </td>
                          );
                        } catch (error) {
                          console.error('Price calculation error:', error);
                          return (
                            <td key={doorStyle.id} className="p-3 text-center border text-muted-foreground">
                              -
                            </td>
                          );
                        }
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">
                No pricing data available for {cabinet.name}
              </p>
            </div>
          )}
        </CardContent>
      </div>

      {/* Enlarged Image Modal */}
      {enlargedImage && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <img 
              src={enlargedImage.url}
              alt={enlargedImage.name}
              className="w-full h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute top-4 left-4 bg-white/90 rounded px-3 py-1">
              <h3 className="font-semibold text-black">{enlargedImage.name}</h3>
            </div>
            <button 
              className="absolute top-4 right-4 bg-white/90 hover:bg-white rounded-full w-8 h-8 flex items-center justify-center text-black font-bold"
              onClick={() => setEnlargedImage(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </Card>
  );
};