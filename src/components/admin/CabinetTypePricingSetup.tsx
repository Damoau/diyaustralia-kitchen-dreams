import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CabinetTypePriceRange, CabinetType } from '@/types/cabinet';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

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
  console.log('CabinetTypePricingSetup component loading - no Select components should be used');
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

  useEffect(() => {
    if (cabinetTypeId && user && !authLoading) {
      console.log('Fetching data for authenticated user:', user.id);
      // Test simple query first
      const testQuery = async () => {
        console.log('Testing simple door styles query...');
        const { data: testData, error: testError } = await supabase
          .from('door_styles')
          .select('id, name, active')
          .limit(3);
        console.log('Test query result:', testData?.length || 0, 'items, error:', testError);
      };
      testQuery();
      fetchData();
    } else if (!authLoading) {
      console.log('Cannot fetch data - cabinetTypeId:', cabinetTypeId, 'user:', !!user, 'authLoading:', authLoading);
      setLoading(false);
    }
  }, [cabinetTypeId, user, authLoading]);

  const fetchData = async () => {
    setLoading(true);
    console.log('CabinetTypePricingSetup: Starting fetchData...');
    try {
      console.log('CabinetTypePricingSetup: Making database queries...');
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

      console.log('CabinetTypePricingSetup: Database queries completed');
      console.log('- Ranges result:', rangesRes.data?.length || 0, 'items, error:', rangesRes.error);
      console.log('- Cabinet type result:', !!cabinetTypeRes?.data, 'error:', cabinetTypeRes?.error);
      console.log('- Door styles result:', doorStylesRes.data?.length || 0, 'items, error:', doorStylesRes.error);
      console.log('- Finishes result:', finishesRes.data?.length || 0, 'items, error:', finishesRes.error);

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
      const { error } = await supabase.from('cabinet_type_finishes').insert({
        cabinet_type_id: cabinetTypeId,
        door_style_id: doorStyleId,
        sort_order: cabinetTypeFinishes.length,
        active: true
      });
      if (error) {
        toast({ title: "Error", description: "Failed to add door style", variant: "destructive" });
        return;
      }
    } else {
      const { error } = await supabase
        .from('cabinet_type_finishes')
        .delete()
        .eq('cabinet_type_id', cabinetTypeId)
        .eq('door_style_id', doorStyleId);
      if (error) {
        toast({ title: "Error", description: "Failed to remove door style", variant: "destructive" });
        return;
      }
    }
    fetchData();
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
      // Delete existing ranges
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

      const { error } = await supabase
        .from('cabinet_type_price_ranges' as any)
        .insert(rangesToInsert);

      if (error) throw error;

      await fetchData();
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
    console.log('CabinetTypePricingSetup: Loading... component loading:', loading, 'auth loading:', authLoading);
    return <div>Loading pricing configuration...</div>;
  }

  if (!user) {
    return <div>Please log in to access this feature.</div>;
  }

  console.log('CabinetTypePricingSetup: Rendering with doorStyles:', doorStyles.length, 'cabinetTypeFinishes:', cabinetTypeFinishes.length);

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
            <CardTitle>Part Quantities</CardTitle>
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
                      {range.min_width_mm}
                    </TableCell>
                    <TableCell>
                      {range.max_width_mm}
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