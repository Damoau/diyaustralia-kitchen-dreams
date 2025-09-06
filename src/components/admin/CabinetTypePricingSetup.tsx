import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CabinetTypePriceRange, CabinetType } from '@/types/cabinet';
import { useToast } from '@/hooks/use-toast';

interface CabinetTypePricingSetupProps {
  cabinetTypeId: string;
}

export function CabinetTypePricingSetup({ cabinetTypeId }: CabinetTypePricingSetupProps) {
  const { toast } = useToast();
  const [priceRanges, setPriceRanges] = useState<CabinetTypePriceRange[]>([]);
  const [cabinetType, setCabinetType] = useState<CabinetType | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoGenMin, setAutoGenMin] = useState(300);
  const [autoGenMax, setAutoGenMax] = useState(600);
  const [increment] = useState(50);

  useEffect(() => {
    if (cabinetTypeId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [cabinetTypeId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rangesRes, cabinetTypeRes] = await Promise.all([
        supabase
          .from('cabinet_type_price_ranges' as any)
          .select('*')
          .eq('cabinet_type_id', cabinetTypeId)
          .order('sort_order'),
        supabase
          .from('cabinet_types')
          .select('*')
          .eq('id', cabinetTypeId)
          .maybeSingle()
      ]);

      if (rangesRes.error) {
        console.error('Error loading ranges:', rangesRes.error);
      }
      if (cabinetTypeRes?.error) {
        console.error('Error loading cabinet type:', cabinetTypeRes.error);
      }

      if (rangesRes.data) setPriceRanges(rangesRes.data as any);
      if (cabinetTypeRes?.data) setCabinetType(cabinetTypeRes.data as CabinetType);
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

  const autoGenerateRanges = async () => {
    if (autoGenMin >= autoGenMax) {
      toast({
        title: "Error",
        description: "Minimum width must be less than maximum width",
        variant: "destructive",
      });
      return;
    }

    // Delete existing ranges
    if (priceRanges.length > 0) {
      const { error: deleteError } = await supabase
        .from('cabinet_type_price_ranges' as any)
        .delete()
        .eq('cabinet_type_id', cabinetTypeId);

      if (deleteError) {
        toast({
          title: "Error",
          description: "Failed to clear existing ranges",
          variant: "destructive",
        });
        return;
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

    const { data, error } = await supabase
      .from('cabinet_type_price_ranges' as any)
      .insert(rangesToInsert)
      .select();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to generate price ranges",
        variant: "destructive",
      });
      return;
    }

    if (data) {
      setPriceRanges(data as any);
      toast({
        title: "Success",
        description: `Generated ${data.length} width ranges`,
      });
    }
  };

  if (loading) {
    return <div>Loading pricing configuration...</div>;
  }

  return (
    <div className="space-y-6">
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
                    onChange={(e) => setAutoGenMin(parseInt(e.target.value))}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label htmlFor="autoGenMax" className="text-sm">Max Width (mm)</Label>
                  <Input
                    id="autoGenMax"
                    type="number"
                    value={autoGenMax}
                    onChange={(e) => setAutoGenMax(parseInt(e.target.value))}
                    className="h-8"
                  />
                </div>
                <Button onClick={autoGenerateRanges} size="sm" className="h-8">
                  <Zap className="h-4 w-4 mr-2" />
                  Auto Generate
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
              <p>No width ranges generated yet.</p>
              <p className="text-sm">Use the auto-generate controls above to create width ranges.</p>
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