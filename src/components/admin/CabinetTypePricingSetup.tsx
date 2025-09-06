import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';
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

  useEffect(() => {
    if (cabinetTypeId) {
      fetchData();
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
          .single()
      ]);

      if (rangesRes.data) setPriceRanges(rangesRes.data as any);
      if (cabinetTypeRes.data) setCabinetType(cabinetTypeRes.data as CabinetType);
    } catch (error) {
      console.error('Error fetching pricing data:', error);
      toast({
        title: "Error",
        description: "Failed to load pricing configuration",
        variant: "destructive",
      });
    }
    setLoading(false);
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

      {/* Price Ranges */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Width Ranges</CardTitle>
          <Button onClick={addPriceRange} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Range
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Min Width (mm)</TableHead>
                <TableHead>Max Width (mm)</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {priceRanges.map((range) => (
                <TableRow key={range.id}>
                  <TableCell>
                    <Input
                      value={range.label}
                      onChange={(e) => updatePriceRange(range.id, { label: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={range.min_width_mm}
                      onChange={(e) => updatePriceRange(range.id, { min_width_mm: parseInt(e.target.value) })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={range.max_width_mm}
                      onChange={(e) => updatePriceRange(range.id, { max_width_mm: parseInt(e.target.value) })}
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
        </CardContent>
      </Card>

      {/* Note about Finish Combinations */}
      <div className="text-sm text-muted-foreground p-4 bg-muted/10 rounded-md">
        <p><strong>Note:</strong> Finish Combinations (Door Style + Finish + Color) are managed separately and will be configured in a dedicated section for creating pricing combinations across all cabinet types.</p>
      </div>
    </div>
  );
}