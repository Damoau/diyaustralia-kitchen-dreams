import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Lock, Unlock, Palette } from "lucide-react";

interface DoorStyle {
  id: string;
  name: string;
  base_rate_per_sqm: number;
}

interface Color {
  id: string;
  name: string;
  surcharge_rate_per_sqm: number;
}

interface StepTwoProps {
  availableDoorStyles: DoorStyle[];
  availableColors: Color[];
  selectedDoorStyle: string;
  selectedColor: string;
  locks: {
    doorStyle: boolean;
    color: boolean;
  };
  onDoorStyleChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onToggleLock: (field: 'doorStyle' | 'color') => void;
}

export function StepTwo({
  availableDoorStyles,
  availableColors,
  selectedDoorStyle,
  selectedColor,
  locks,
  onDoorStyleChange,
  onColorChange,
  onToggleLock
}: StepTwoProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Style & Finish</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose your door style and color finish
        </p>
      </div>

      <TooltipProvider>
        <div className="space-y-6">
          {/* Door Style Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-medium text-base">Door Style</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleLock('doorStyle')}
                    className="h-8 w-8 p-0"
                  >
                    {locks.doorStyle ? <Lock className="h-4 w-4 text-primary" /> : <Unlock className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Lock this door style for future configurations</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            <Select value={selectedDoorStyle} onValueChange={onDoorStyleChange}>
              <SelectTrigger className={`w-full h-12 ${locks.doorStyle ? 'border-primary border-2' : ''}`}>
                <SelectValue placeholder="Select a door style" />
              </SelectTrigger>
              <SelectContent>
                {availableDoorStyles.map((style) => (
                  <SelectItem key={style.id} value={style.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{style.name}</span>
                      <span className="text-sm text-muted-foreground ml-4">
                        ${style.base_rate_per_sqm}/m²
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Color Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-medium text-base">Color</Label>
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleLock('color')}
                      className="h-8 w-8 p-0"
                    >
                      {locks.color ? <Lock className="h-4 w-4 text-primary" /> : <Unlock className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Lock this color for future configurations</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            
            <Select 
              value={selectedColor} 
              onValueChange={onColorChange}
              disabled={!selectedDoorStyle || availableColors.length === 0}
            >
              <SelectTrigger className={`w-full h-12 ${locks.color ? 'border-primary border-2' : ''}`}>
                <SelectValue placeholder="Select a color" />
              </SelectTrigger>
              <SelectContent>
                {availableColors.map((color) => (
                  <SelectItem key={color.id} value={color.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{color.name}</span>
                      {color.surcharge_rate_per_sqm > 0 && (
                        <span className="text-sm text-muted-foreground ml-4">
                          +${color.surcharge_rate_per_sqm}/m²
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {!selectedDoorStyle && (
              <p className="text-sm text-muted-foreground">
                Please select a door style first to see available colors
              </p>
            )}
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}