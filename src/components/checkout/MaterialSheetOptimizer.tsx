import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, Layers, Ruler, Weight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CabinetItem {
  id: string;
  cabinetTypeId: string;
  width_mm: number;
  height_mm: number;
  depth_mm: number;
  doorStyleId?: string;
  quantity: number;
  name: string;
}

interface SheetLayout {
  sheet_number: number;
  parts: Array<{
    part_name: string;
    width_mm: number;
    height_mm: number;
    quantity: number;
    thickness_mm: number;
    area_sqm: number;
    weight_kg: number;
  }>;
  total_area_used_sqm: number;
  efficiency_percent: number;
  stack_height_mm: number;
  total_weight_kg: number;
}

interface MaterialSheetOptimizerProps {
  items: CabinetItem[];
  onOptimizationComplete?: (packages: any[]) => void;
  className?: string;
}

const SHEET_WIDTH_MM = 2400;
const SHEET_HEIGHT_MM = 1200;
const SHEET_AREA_SQM = (SHEET_WIDTH_MM * SHEET_HEIGHT_MM) / 1000000;

export const MaterialSheetOptimizer: React.FC<MaterialSheetOptimizerProps> = ({
  items,
  onOptimizationComplete,
  className = '',
}) => {
  const [sheetLayouts, setSheetLayouts] = useState<SheetLayout[]>([]);
  const [loading, setLoading] = useState(false);
  const [doorStyles, setDoorStyles] = useState<any[]>([]);
  const [cabinetParts, setCabinetParts] = useState<any[]>([]);

  // Load door styles and cabinet parts data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [doorStylesResult, cabinetPartsResult] = await Promise.all([
          supabase.from('door_styles').select('*'),
          supabase.from('cabinet_parts').select('*')
        ]);

        if (doorStylesResult.data) setDoorStyles(doorStylesResult.data);
        if (cabinetPartsResult.data) setCabinetParts(cabinetPartsResult.data);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  // Optimize material sheets when items change
  useEffect(() => {
    const optimizeSheets = async () => {
      if (!items.length || !doorStyles.length || !cabinetParts.length) return;

      setLoading(true);
      try {
        const layouts = await calculateOptimalSheetLayout(items);
        setSheetLayouts(layouts);
        
        // Create package data for shipping calculator
        const packages = layouts.map((layout, index) => ({
          kind: 'pallet' as const,
          length_mm: SHEET_WIDTH_MM,
          width_mm: SHEET_HEIGHT_MM,
          height_mm: layout.stack_height_mm + 100, // Add 100mm padding for packaging
          weight_kg: layout.total_weight_kg + 5, // Add 5kg for packaging/wrapping
          cubic_m: ((SHEET_WIDTH_MM * SHEET_HEIGHT_MM * (layout.stack_height_mm + 100)) / 1000000000),
          fragile: false,
          stackable: index === 0, // Only first pallet stackable
          contents: {
            sheet_number: layout.sheet_number,
            parts_count: layout.parts.length,
            efficiency: layout.efficiency_percent
          }
        }));

        onOptimizationComplete?.(packages);
      } catch (error) {
        console.error('Error optimizing sheets:', error);
      } finally {
        setLoading(false);
      }
    };

    optimizeSheets();
  }, [items, doorStyles, cabinetParts, onOptimizationComplete]);

  const calculateOptimalSheetLayout = async (items: CabinetItem[]): Promise<SheetLayout[]> => {
    const layouts: SheetLayout[] = [];
    let currentSheet: SheetLayout = {
      sheet_number: 1,
      parts: [],
      total_area_used_sqm: 0,
      efficiency_percent: 0,
      stack_height_mm: 0,
      total_weight_kg: 0
    };

    // Process each cabinet item
    for (const item of items) {
      const doorStyle = doorStyles.find(ds => ds.id === item.doorStyleId);
      const itemCabinetParts = cabinetParts.filter(part => part.cabinet_type_id === item.cabinetTypeId);

      // Calculate parts for this cabinet item
      for (const part of itemCabinetParts) {
        for (let qty = 0; qty < item.quantity; qty++) {
          const partWidth = calculateDimension(part.width_formula, item.width_mm, item.height_mm, item.depth_mm);
          const partHeight = calculateDimension(part.height_formula, item.width_mm, item.height_mm, item.depth_mm);
          
          // Skip if part is too large for sheet
          if (partWidth > SHEET_WIDTH_MM || partHeight > SHEET_HEIGHT_MM) continue;

          const partAreaSqm = (partWidth * partHeight) / 1000000;
          const thickness = doorStyle?.thickness_mm || 18;
          const weightPerSqm = doorStyle?.material_density_kg_per_sqm || 12.0;
          const partWeight = partAreaSqm * weightPerSqm;

          // Check if part fits on current sheet
          if (currentSheet.total_area_used_sqm + partAreaSqm > SHEET_AREA_SQM * 0.85) {
            // Sheet is full (85% efficiency target), start new sheet
            currentSheet.efficiency_percent = (currentSheet.total_area_used_sqm / SHEET_AREA_SQM) * 100;
            layouts.push({ ...currentSheet });
            
            currentSheet = {
              sheet_number: layouts.length + 1,
              parts: [],
              total_area_used_sqm: 0,
              efficiency_percent: 0,
              stack_height_mm: 0,
              total_weight_kg: 0
            };
          }

          // Add part to current sheet
          currentSheet.parts.push({
            part_name: `${item.name} - ${part.name || 'Part'}`,
            width_mm: partWidth,
            height_mm: partHeight,
            quantity: part.quantity || 1,
            thickness_mm: thickness,
            area_sqm: partAreaSqm,
            weight_kg: partWeight
          });

          currentSheet.total_area_used_sqm += partAreaSqm;
          currentSheet.stack_height_mm = Math.max(currentSheet.stack_height_mm, thickness * (part.quantity || 1));
          currentSheet.total_weight_kg += partWeight;
        }
      }
    }

    // Add final sheet if it has parts
    if (currentSheet.parts.length > 0) {
      currentSheet.efficiency_percent = (currentSheet.total_area_used_sqm / SHEET_AREA_SQM) * 100;
      layouts.push(currentSheet);
    }

    return layouts;
  };

  const calculateDimension = (formula: string | null, width: number, height: number, depth: number): number => {
    if (!formula) return 0;
    
    try {
      const expression = formula
        .replace(/width/g, width.toString())
        .replace(/height/g, height.toString())
        .replace(/depth/g, depth.toString());
      
      // Use expr-eval for safe expression evaluation
      const { Parser } = require('expr-eval');
      const parser = new Parser();
      return parser.evaluate(expression);
    } catch {
      return 0;
    }
  };

  const formatWeight = (weight: number) => `${weight.toFixed(1)}kg`;
  const formatDimension = (mm: number) => `${mm}mm`;
  const formatArea = (sqm: number) => `${sqm.toFixed(2)}m²`;

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-2">
            <Package className="h-5 w-5 animate-pulse" />
            <span>Optimizing material sheets...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Material Sheet Optimization (2400×1200mm)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted rounded-md">
              <div className="text-2xl font-bold">{sheetLayouts.length}</div>
              <div className="text-sm text-muted-foreground">Sheets Required</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-md">
              <div className="text-2xl font-bold">
                {formatWeight(sheetLayouts.reduce((sum, sheet) => sum + sheet.total_weight_kg, 0))}
              </div>
              <div className="text-sm text-muted-foreground">Total Weight</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-md">
              <div className="text-2xl font-bold">
                {formatDimension(Math.max(...sheetLayouts.map(s => s.stack_height_mm), 0))}
              </div>
              <div className="text-sm text-muted-foreground">Max Height</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-md">
              <div className="text-2xl font-bold">
                {(sheetLayouts.reduce((sum, sheet) => sum + sheet.efficiency_percent, 0) / sheetLayouts.length || 0).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Efficiency</div>
            </div>
          </div>

          <Separator />

          {/* Sheet Details */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Sheet Breakdown
            </h4>
            
            {sheetLayouts.map((sheet) => (
              <Card key={sheet.sheet_number} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium">Sheet #{sheet.sheet_number}</h5>
                    <div className="flex gap-2">
                      <Badge variant="secondary">
                        {sheet.efficiency_percent.toFixed(1)}% efficient
                      </Badge>
                      <Badge variant="outline">
                        {sheet.parts.length} parts
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-muted-foreground" />
                      <span>Height: {formatDimension(sheet.stack_height_mm)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Weight className="h-4 w-4 text-muted-foreground" />
                      <span>Weight: {formatWeight(sheet.total_weight_kg)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>Area: {formatArea(sheet.total_area_used_sqm)}</span>
                    </div>
                  </div>

                  <details className="text-xs">
                    <summary className="cursor-pointer hover:text-primary">
                      View parts ({sheet.parts.length} items)
                    </summary>
                    <div className="mt-2 space-y-1 pl-4 border-l-2 border-muted">
                      {sheet.parts.map((part, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                          <span className="font-medium">{part.part_name}</span>
                          <div className="text-right">
                            <div>{part.width_mm}×{part.height_mm}×{part.thickness_mm}mm</div>
                            <div className="text-muted-foreground">
                              {formatArea(part.area_sqm)} • {formatWeight(part.weight_kg)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                </CardContent>
              </Card>
            ))}
          </div>

          {sheetLayouts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No items to optimize</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};