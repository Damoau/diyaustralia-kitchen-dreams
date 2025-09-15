import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CabinetType } from "@/types/cabinet";

interface CornerCabinetConfigProps {
  cabinetType: CabinetType;
  rightSideWidth: number;
  leftSideWidth: number;
  height: number;
  rightSideDepth: number;
  leftSideDepth: number;
  onRightSideWidthChange: (value: number) => void;
  onLeftSideWidthChange: (value: number) => void;
  onHeightChange: (value: number) => void;
  onRightSideDepthChange: (value: number) => void;
  onLeftSideDepthChange: (value: number) => void;
}

export function CornerCabinetConfig({
  cabinetType,
  rightSideWidth,
  leftSideWidth,
  height,
  rightSideDepth,
  leftSideDepth,
  onRightSideWidthChange,
  onLeftSideWidthChange,
  onHeightChange,
  onRightSideDepthChange,
  onLeftSideDepthChange,
}: CornerCabinetConfigProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="right-side-width">Right Side Width (mm)</Label>
        <Input
          id="right-side-width"
          type="number"
          value={rightSideWidth}
          onChange={(e) => onRightSideWidthChange(Number(e.target.value))}
          min={cabinetType.min_width_mm || 100}
          max={cabinetType.max_width_mm || 1200}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="left-side-width">Left Side Width (mm)</Label>
        <Input
          id="left-side-width"
          type="number"
          value={leftSideWidth}
          onChange={(e) => onLeftSideWidthChange(Number(e.target.value))}
          min={cabinetType.min_width_mm || 100}
          max={cabinetType.max_width_mm || 1200}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="height">Height (mm)</Label>
        <Input
          id="height"
          type="number"
          value={height}
          onChange={(e) => onHeightChange(Number(e.target.value))}
          min={cabinetType.min_height_mm || 200}
          max={cabinetType.max_height_mm || 1000}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="right-side-depth">Right Side Depth (mm)</Label>
        <Input
          id="right-side-depth"
          type="number"
          value={rightSideDepth}
          onChange={(e) => onRightSideDepthChange(Number(e.target.value))}
          min={cabinetType.min_depth_mm || 200}
          max={cabinetType.max_depth_mm || 800}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="left-side-depth">Left Side Depth (mm)</Label>
        <Input
          id="left-side-depth"
          type="number"
          value={leftSideDepth}
          onChange={(e) => onLeftSideDepthChange(Number(e.target.value))}
          min={cabinetType.min_depth_mm || 200}
          max={cabinetType.max_depth_mm || 800}
        />
      </div>
    </div>
  );
}