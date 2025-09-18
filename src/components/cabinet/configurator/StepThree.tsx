import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Lock, Unlock, Wrench } from "lucide-react";

interface HardwareBrand {
  id: string;
  name: string;
  description?: string;
}

interface StepThreeProps {
  availableHardwareBrands: HardwareBrand[];
  selectedHardwareBrand: string;
  locks: {
    hardware: boolean;
  };
  onHardwareChange: (value: string) => void;
  onToggleLock: (field: 'hardware') => void;
}

export function StepThree({
  availableHardwareBrands,
  selectedHardwareBrand,
  locks,
  onHardwareChange,
  onToggleLock
}: StepThreeProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Hardware Selection</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose the hardware brand for hinges, drawer slides, and other components
        </p>
      </div>

      <TooltipProvider>
        <div className="space-y-6">
          {/* Hardware Brand Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <Label className="font-medium text-base">Hardware Brand</Label>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleLock('hardware')}
                    className="h-8 w-8 p-0"
                  >
                    {locks.hardware ? <Lock className="h-4 w-4 text-primary" /> : <Unlock className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Lock this hardware brand for future configurations</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            <Select value={selectedHardwareBrand} onValueChange={onHardwareChange}>
              <SelectTrigger className={`w-full h-12 ${locks.hardware ? 'border-primary border-2' : ''}`}>
                <SelectValue placeholder="Select hardware brand" />
              </SelectTrigger>
              <SelectContent>
                {availableHardwareBrands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{brand.name}</span>
                      {brand.description && (
                        <span className="text-sm text-muted-foreground">
                          {brand.description}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Hardware Information */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="font-medium mb-2">What's Included</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Door hinges and soft-close mechanisms</li>
              <li>• Drawer slides (if applicable)</li>
              <li>• Mounting hardware and brackets</li>
              <li>• Adjustment mechanisms</li>
            </ul>
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}