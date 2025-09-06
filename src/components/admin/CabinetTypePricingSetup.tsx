import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, Zap, Calculator } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CabinetTypePriceRange, CabinetType } from '@/types/cabinet';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { PricingFormulaBreakdown } from './PricingFormulaBreakdown';
import { PolyPricingBreakdown } from './PolyPricingBreakdown';

interface DoorStyle {
  id: string;
  name: string;
  description?: string;
  base_rate_per_sqm: number;
}

interface CabinetTypeFinish {
  id: string;
  cabinet_type_id: string;
  door_style_id: string;
  color_id?: string;
  door_style_finish_id?: string;
  sort_order: number;
  active: boolean;
}

interface CabinetTypePricingSetupProps {
  cabinetTypeId: string;
}

export function CabinetTypePricingSetup({ cabinetTypeId }: CabinetTypePricingSetupProps) {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [priceRanges, setPriceRanges] = useState<CabinetTypePriceRange[]>([]);
  const [cabinetType, setCabinetType] = useState<CabinetType | null>(null);
  const [doorStyles, setDoorStyles] = useState<DoorStyle[]>([]);
  const [cabinetTypeFinishes, setCabinetTypeFinishes] = useState<CabinetTypeFinish[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoGenMin, setAutoGenMin] = useState(300);
  const [autoGenMax, setAutoGenMax] = useState(600);
  const [increment] = useState(50);
  const [generating, setGenerating] = useState(false);
  const [showFormula, setShowFormula] = useState(false);
  const [showPolyExample, setShowPolyExample] = useState(false);

  useEffect(() => {
    if (cabinetTypeId && user && !authLoading) {
      fetchData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [cabinetTypeId, user, authLoading]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rangesRes, cabinetTypeRes, doorStylesRes, finishesRes] = await Promise.all([
        supabase
          .from('cabinet_type_price_ranges' as any)
          .select('*')
          .eq('cabinet_type_id', cabinetTypeId)
          .order('sort_order'),
        supabase
          .from('cabinet_types')
          .select('*')
          .eq('id', cabinetTypeId)
          .maybeSingle(),
        supabase
          .from('door_styles')
          .select('*')
          .eq('active', true)
          .order('name'),
        supabase
          .from('cabinet_type_finishes')
          .select('*')
          .eq('cabinet_type_id', cabinetTypeId)
          .eq('active', true)
      ]);

      if (rangesRes.error) {
        console.error('Error loading ranges:', rangesRes.error);
      }
      if (cabinetTypeRes?.error) {
        console.error('Error loading cabinet type:', cabinetTypeRes.error);
      }
      if (doorStylesRes.error) {
        console.error('Error loading door styles:', doorStylesRes.error);
        toast({
          title: 'Error',
          description: `Failed to load door styles: ${doorStylesRes.error.message}`,
          variant: 'destructive',
        });
      } else {
        console.log('Door styles loaded successfully:', doorStylesRes.data?.length || 0, 'items');
      }
      if (finishesRes.error) {
        console.error('Error loading finishes:', finishesRes.error);
      }

      if (rangesRes.data) setPriceRanges(rangesRes.data as any);
      if (cabinetTypeRes?.data) setCabinetType(cabinetTypeRes.data as CabinetType);
      if (doorStylesRes.data) setDoorStyles(doorStylesRes.data as DoorStyle[]);
      if (finishesRes.data) setCabinetTypeFinishes(finishesRes.data as CabinetTypeFinish[]);
    } catch (error) {
      console.error('Error fetching pricing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pricing configuration',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addPriceRange = async () => {
    const newRange = {
      cabinet_type_id: cabinetTypeId,
      label: "New Range",
      min_width_mm: 300,
      max_width_mm: 600,
      sort_order: priceRanges.length,
      active: true
    };

    const { data, error } = await supabase
      .from('cabinet_type_price_ranges' as any)
      .insert(newRange)
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add price range",
        variant: "destructive",
      });
      return;
    }

    if (data) {
      setPriceRanges([...priceRanges, data as any]);
    }
  };

  const updatePriceRange = async (id: string, updates: Partial<CabinetTypePriceRange>) => {
    const { error } = await supabase
      .from('cabinet_type_price_ranges' as any)
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update price range",
        variant: "destructive",
      });
      return;
    }

    setPriceRanges(priceRanges.map(range => 
      range.id === id ? { ...range, ...updates } : range
    ));
  };

  const deletePriceRange = async (id: string) => {
    const { error } = await supabase
      .from('cabinet_type_price_ranges' as any)
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete price range",
        variant: "destructive",
      });
      return;
    }

    setPriceRanges(priceRanges.filter(range => range.id !== id));
  };

  // Helpers for inline editing of width ranges with optimistic UI
  const handleRangeChange = (id: string, field: 'min_width_mm' | 'max_width_mm', value: number) => {
    setPriceRanges(prev => prev.map(r => r.id === id ? {
      ...r,
      [field]: value,
      // Keep label roughly in sync during typing
      label: `${Number(field === 'min_width_mm' ? value : r.min_width_mm) || 0} - ${Number(field === 'max_width_mm' ? value : r.max_width_mm) || 0}`
    } : r));
  };

  const persistRange = async (id: string) => {
    const r = priceRanges.find(pr => pr.id === id);
    if (!r) return;
    const min = Number(r.min_width_mm) || 0;
    const max = Number(r.max_width_mm) || 0;
    await updatePriceRange(id, { min_width_mm: min, max_width_mm: max, label: `${min} - ${max}` });
  };

  const updateCabinetTypeQuantities = async (updates: { backs_qty?: number; bottoms_qty?: number; sides_qty?: number; door_qty?: number }) => {
    const { error } = await supabase
      .from('cabinet_types')
      .update(updates)
      .eq('id', cabinetTypeId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update part quantities",
        variant: "destructive",
      });
      return;
    }

    if (cabinetType) {
      setCabinetType({ ...cabinetType, ...updates });
    }
  };

  const generateAutoRanges = () => {
    const ranges = [];
    for (let start = autoGenMin; start < autoGenMax; start += increment) {
      const end = start + increment - 1;
      const isLastRange = start + increment >= autoGenMax;
      const finalEnd = isLastRange ? autoGenMax : end;
      
      ranges.push({
        min: start,
        max: finalEnd,
        label: `${start} - ${finalEnd}`
      });
      
      if (isLastRange) break;
    }
    return ranges;
  };

  const toggleDoorStyle = async (doorStyleId: string, enabled: boolean) => {
    if (enabled) {
      // Optimistic update - add to local state first
      const newFinish = {
        id: `temp-${Date.now()}`, // Temporary ID
        cabinet_type_id: cabinetTypeId,
        door_style_id: doorStyleId,
        sort_order: cabinetTypeFinishes.length,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        depth_mm: null,
        door_style_finish_id: null,
        color_id: null
      };
      setCabinetTypeFinishes([...cabinetTypeFinishes, newFinish]);
      
      const { error } = await supabase.from('cabinet_type_finishes').insert({
        cabinet_type_id: cabinetTypeId,
        door_style_id: doorStyleId,
        sort_order: cabinetTypeFinishes.length,
        active: true
      });
      
      if (error) {
        // Rollback optimistic update
        setCabinetTypeFinishes(cabinetTypeFinishes.filter(f => f.id !== newFinish.id));
        toast({ title: "Error", description: "Failed to add door style", variant: "destructive" });
        return;
      }
    } else {
      // Optimistic update - remove from local state first
      const originalFinishes = [...cabinetTypeFinishes];
      setCabinetTypeFinishes(cabinetTypeFinishes.filter(f => f.door_style_id !== doorStyleId));
      
      const { error } = await supabase
        .from('cabinet_type_finishes')
        .delete()
        .eq('cabinet_type_id', cabinetTypeId)
        .eq('door_style_id', doorStyleId);
        
      if (error) {
        // Rollback optimistic update
        setCabinetTypeFinishes(originalFinishes);
        toast({ title: "Error", description: "Failed to remove door style", variant: "destructive" });
        return;
      }
    }
  };

  const isDoorStyleEnabled = (doorStyleId: string) => {
    return cabinetTypeFinishes.some(finish => finish.door_style_id === doorStyleId);
  };

  const autoGenerateRanges = async () => {
    if (autoGenMin >= autoGenMax) {
      toast({
        title: "Error",
        description: "Minimum width must be less than maximum width",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);

    try {
      // Delete existing ranges first
      if (priceRanges.length > 0) {
        const { error: deleteError } = await supabase
          .from('cabinet_type_price_ranges' as any)
          .delete()
          .eq('cabinet_type_id', cabinetTypeId);

        if (deleteError) {
          throw deleteError;
        }
      }

      // Generate new ranges
      const autoRanges = generateAutoRanges();
      const rangesToInsert = autoRanges.map((range, index) => ({
        cabinet_type_id: cabinetTypeId,
        label: range.label,
        min_width_mm: range.min,
        max_width_mm: range.max,
        sort_order: index,
        active: true
      }));

      // Insert new ranges and get the created data
      const { data, error } = await supabase
        .from('cabinet_type_price_ranges' as any)
        .insert(rangesToInsert)
        .select('*');

      if (error) throw error;

      // Optimistically update local state with the created ranges
      if (data) {
        setPriceRanges(data as any[]);
      }

      toast({
        title: "Success",
        description: `Generated ${rangesToInsert.length} width ranges`,
      });
    } catch (err) {
      console.error('Auto-generate error:', err);
      toast({
        title: "Error",
        description: "Failed to generate price ranges",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading || authLoading) {
    return <div>Loading pricing configuration...</div>;
  }

  if (!user) {
    return <div>Please log in to access this feature.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Door Styles Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Available Door Styles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {doorStyles.map((style) => (
              <div key={style.id} className="flex items-center space-x-2 p-2 border rounded bg-muted/30">
                <Checkbox
                  id={`door-style-${style.id}`}
                  checked={isDoorStyleEnabled(style.id)}
                  onCheckedChange={(checked) => toggleDoorStyle(style.id, checked as boolean)}
                />
                <Label htmlFor={`door-style-${style.id}`} className="flex-1">
                  {style.name} - ${style.base_rate_per_sqm}/m²
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Door Styles Summary */}
      {cabinetTypeFinishes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Door Styles for This Cabinet Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {cabinetTypeFinishes.map((finish) => {
                const doorStyle = doorStyles.find(ds => ds.id === finish.door_style_id);
                return doorStyle ? (
                  <div key={finish.id} className="flex items-center justify-between p-2 border rounded bg-green-50">
                    <span className="text-sm font-medium">{doorStyle.name}</span>
                    <span className="text-xs text-muted-foreground">${doorStyle.base_rate_per_sqm}/m²</span>
                  </div>
                ) : null;
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Part Quantities */}
      {cabinetType && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Part Quantities</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure the number of each part type for this cabinet
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFormula(!showFormula)}
                  className="flex items-center gap-2"
                >
                  <Calculator className="h-4 w-4" />
                  {showFormula ? 'Hide' : 'Show'} Formula
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPolyExample(!showPolyExample)}
                  className="flex items-center gap-2"
                >
                  <Calculator className="h-4 w-4" />
                  Poly 750-799 Example
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="backs_qty">Backs Quantity</Label>
                <Input
                  id="backs_qty"
                  type="number"
                  value={cabinetType.backs_qty || 1}
                  onChange={(e) => updateCabinetTypeQuantities({ backs_qty: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="bottoms_qty">Bottoms Quantity</Label>
                <Input
                  id="bottoms_qty"
                  type="number"
                  value={cabinetType.bottoms_qty || 1}
                  onChange={(e) => updateCabinetTypeQuantities({ bottoms_qty: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="sides_qty">Sides Quantity</Label>
                <Input
                  id="sides_qty"
                  type="number"
                  value={cabinetType.sides_qty || 2}
                  onChange={(e) => updateCabinetTypeQuantities({ sides_qty: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="door_qty">Doors Quantity</Label>
                <Input
                  id="door_qty"
                  type="number"
                  value={cabinetType.door_qty || 0}
                  onChange={(e) => updateCabinetTypeQuantities({ door_qty: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Formula Breakdown */}
      {showFormula && cabinetType && (
        <PricingFormulaBreakdown cabinetType={cabinetType} />
      )}

      {/* Poly 750-799 Example */}
      {showPolyExample && (
        <PolyPricingBreakdown />
      )}

      {/* Poly 750-799 Example */}
      {showPolyExample && (
        <PolyPricingBreakdown />
      )}

      {/* Width Ranges with Auto Generate */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4">
            <div className="flex flex-row items-center justify-between">
              <CardTitle>Width Ranges</CardTitle>
              <Button onClick={addPriceRange} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Range
              </Button>
            </div>
            
            {/* Auto Generate Controls */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-3 gap-4 items-end">
                <div>
                  <Label htmlFor="autoGenMin" className="text-sm">Min Width (mm)</Label>
                  <Input
                    id="autoGenMin"
                    type="number"
                    value={autoGenMin}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      setAutoGenMin(Number.isNaN(v) ? 0 : v);
                    }}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label htmlFor="autoGenMax" className="text-sm">Max Width (mm)</Label>
                  <Input
                    id="autoGenMax"
                    type="number"
                    value={autoGenMax}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      setAutoGenMax(Number.isNaN(v) ? 0 : v);
                    }}
                    className="h-8"
                  />
                </div>
                <Button onClick={autoGenerateRanges} size="sm" className="h-8" disabled={generating}>
                  <Zap className="h-4 w-4 mr-2" />
                  {generating ? 'Generating…' : 'Auto Generate'}
                </Button>
              </div>
              
              {/* Preview */}
              <div className="mt-3">
                <Label className="text-xs text-muted-foreground">Preview (50mm increments):</Label>
                <div className="mt-1 p-2 bg-muted/20 rounded-md">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 text-xs">
                    {generateAutoRanges().map((range, index) => (
                      <div key={index} className="px-2 py-1 bg-background rounded border text-center">
                        {range.label}mm
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {priceRanges.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Width Range</TableHead>
                  <TableHead>Min Width (mm)</TableHead>
                  <TableHead>Max Width (mm)</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priceRanges.map((range) => (
                  <TableRow key={range.id}>
                    <TableCell className="font-medium">
                      {range.label}mm
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={range.min_width_mm}
                        onChange={(e) => handleRangeChange(range.id, 'min_width_mm', parseInt(e.target.value) || 0)}
                        onBlur={() => persistRange(range.id)}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={range.max_width_mm}
                        onChange={(e) => handleRangeChange(range.id, 'max_width_mm', parseInt(e.target.value) || 0)}
                        onBlur={() => persistRange(range.id)}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => deletePriceRange(range.id)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No width ranges created yet.</p>
              <p className="text-sm">Use the auto-generate button above to create width ranges.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Note about Finish Combinations */}
      <div className="text-sm text-muted-foreground p-4 bg-muted/10 rounded-md">
        <p><strong>Note:</strong> Finish Combinations (Door Style + Finish + Color) are managed separately and will be configured in a dedicated section for creating pricing combinations across all cabinet types.</p>
      </div>
    </div>
  );
}