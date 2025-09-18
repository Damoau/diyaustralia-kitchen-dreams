import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Lock, Unlock, Info } from "lucide-react";
import { CabinetType } from "@/types/cabinet";
import { CornerCabinetConfig } from "../CornerCabinetConfig";

interface StepOneProps {
  cabinetType: CabinetType;
  width: number;
  height: number;
  depth: number;
  rightSideWidth?: number;
  leftSideWidth?: number;
  rightSideDepth?: number;
  leftSideDepth?: number;
  locks: {
    height: boolean;
    depth: boolean;
  };
  onWidthChange: (value: number) => void;
  onHeightChange: (value: number) => void;
  onDepthChange: (value: number) => void;
  onRightSideWidthChange?: (value: number) => void;
  onLeftSideWidthChange?: (value: number) => void;
  onRightSideDepthChange?: (value: number) => void;
  onLeftSideDepthChange?: (value: number) => void;
  onToggleLock: (field: 'height' | 'depth') => void;
}

export function StepOne({
  cabinetType,
  width,
  height,
  depth,
  rightSideWidth,
  leftSideWidth,
  rightSideDepth,
  leftSideDepth,
  locks,
  onWidthChange,
  onHeightChange,
  onDepthChange,
  onRightSideWidthChange,
  onLeftSideWidthChange,
  onRightSideDepthChange,
  onLeftSideDepthChange,
  onToggleLock
}: StepOneProps) {
  const isCorner = cabinetType.cabinet_style === 'corner';

  if (isCorner) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Cabinet Dimensions</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Configure the dimensions for your corner cabinet
          </p>
        </div>
        
        <CornerCabinetConfig
          cabinetType={cabinetType}
          rightSideWidth={rightSideWidth || width}
          leftSideWidth={leftSideWidth || width}
          height={height}
          rightSideDepth={rightSideDepth || depth}
          leftSideDepth={leftSideDepth || depth}
          onRightSideWidthChange={onRightSideWidthChange || onWidthChange}
          onLeftSideWidthChange={onLeftSideWidthChange || onWidthChange}
          onHeightChange={onHeightChange}
          onRightSideDepthChange={onRightSideDepthChange || onDepthChange}
          onLeftSideDepthChange={onLeftSideDepthChange || onDepthChange}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Cabinet Dimensions</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Set the width, height, and depth for your cabinet
        </p>
      </div>

      <TooltipProvider>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Width */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="font-medium">Width (mm)</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Range: {cabinetType.min_width_mm}mm - {cabinetType.max_width_mm}mm</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="relative">
              <Input
                type="number"
                value={width === 0 ? '' : width}
                onChange={(e) => onWidthChange(e.target.value === '' ? 0 : Number(e.target.value))}
                className="text-center font-medium"
                placeholder={cabinetType.default_width_mm.toString()}
                min={cabinetType.min_width_mm}
                max={cabinetType.max_width_mm}
              />
            </div>
            <div className="text-xs text-muted-foreground text-center">
              {cabinetType.min_width_mm} - {cabinetType.max_width_mm}mm
            </div>
          </div>

          {/* Height */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="font-medium">Height (mm)</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Standard height: {cabinetType.default_height_mm}mm</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="relative">
              <Input
                type="number"
                value={height === 0 ? '' : height}
                onChange={(e) => onHeightChange(e.target.value === '' ? 0 : Number(e.target.value))}
                className={`text-center font-medium ${locks.height ? 'border-primary border-2' : ''}`}
                placeholder={cabinetType.default_height_mm.toString()}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleLock('height')}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  >
                    {locks.height ? <Lock className="h-3 w-3 text-primary" /> : <Unlock className="h-3 w-3 text-muted-foreground" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Lock this height for future configurations</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Depth */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="font-medium">Depth (mm)</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Standard depth: {cabinetType.default_depth_mm}mm</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="relative">
              <Input
                type="number"
                value={depth === 0 ? '' : depth}
                onChange={(e) => onDepthChange(e.target.value === '' ? 0 : Number(e.target.value))}
                className={`text-center font-medium ${locks.depth ? 'border-primary border-2' : ''}`}
                placeholder={cabinetType.default_depth_mm.toString()}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleLock('depth')}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  >
                    {locks.depth ? <Lock className="h-3 w-3 text-primary" /> : <Unlock className="h-3 w-3 text-muted-foreground" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Lock this depth for future configurations</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}