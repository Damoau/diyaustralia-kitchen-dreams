import { useState } from "react";
import { ZoomIn, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CabinetType } from "@/types/cabinet";

interface ProductPreviewProps {
  cabinetType: CabinetType;
  currentImage?: string;
  width: number;
  height: number;
  depth: number;
  isCorner?: boolean;
  rightSideWidth?: number;
  leftSideWidth?: number;
}

export function ProductPreview({ 
  cabinetType, 
  currentImage, 
  width, 
  height, 
  depth,
  isCorner,
  rightSideWidth,
  leftSideWidth
}: ProductPreviewProps) {
  const [showFullscreen, setShowFullscreen] = useState(false);
  
  const imageUrl = currentImage || cabinetType.product_image_url;

  return (
    <>
      <div className="relative bg-muted/30 rounded-lg overflow-hidden">
        {/* Product Image */}
        <div className="aspect-square flex items-center justify-center p-4">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={cabinetType.name}
              className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex flex-col items-center text-muted-foreground">
              <Package className="h-16 w-16 mb-2" />
              <span className="text-sm">No Image Available</span>
            </div>
          )}
        </div>

        {/* Zoom Button */}
        {imageUrl && (
          <Button
            variant="secondary"
            size="sm"
            className="absolute top-3 right-3"
            onClick={() => setShowFullscreen(true)}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        )}

        {/* Dimensions Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <div className="text-white text-sm space-y-1">
            <div className="font-medium">{cabinetType.name}</div>
            {isCorner ? (
              <div className="space-y-0.5 text-xs">
                <div>Right: {rightSideWidth}mm × {height}mm × {depth}mm</div>
                <div>Left: {leftSideWidth}mm × {height}mm × {depth}mm</div>
              </div>
            ) : (
              <div className="text-xs">
                {width}mm × {height}mm × {depth}mm
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-4xl">
          <div className="aspect-square w-full">
            {imageUrl && (
              <img
                src={imageUrl}
                alt={cabinetType.name}
                className="w-full h-full object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}