import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CabinetTypePriceRange, CabinetTypeFinish, DoorStyle, DoorStyleFinish, Color, CabinetType } from '@/types/cabinet';
import { useToast } from '@/hooks/use-toast';

interface CabinetTypePricingSetupProps {
  cabinetTypeId: string;
}

export function CabinetTypePricingSetup({ cabinetTypeId }: CabinetTypePricingSetupProps) {
  const { toast } = useToast();
  const [priceRanges, setPriceRanges] = useState<CabinetTypePriceRange[]>([]);
  const [cabinetTypeFinishes, setCabinetTypeFinishes] = useState<CabinetTypeFinish[]>([]);
  const [allDoorStyles, setAllDoorStyles] = useState<DoorStyle[]>([]);
  const [allDoorStyleFinishes, setAllDoorStyleFinishes] = useState<DoorStyleFinish[]>([]);
  const [allColors, setAllColors] = useState<Color[]>([]);
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
      const [rangesRes, finishesRes, doorStylesRes, doorStyleFinishesRes, colorsRes, cabinetTypeRes] = await Promise.all([
        supabase
          .from('cabinet_type_price_ranges' as any)
          .select('*')
          .eq('cabinet_type_id', cabinetTypeId)
          .order('sort_order'),
          supabase
            .from('cabinet_type_finishes' as any)
            .select(`
              *,
              door_style_finish:door_style_finishes!inner(*),
              door_style:door_styles!inner(*),
              color:colors(*)
            `)
            .eq('cabinet_type_id', cabinetTypeId)
            .order('sort_order'),
        supabase
          .from('door_styles')
          .select('*')
          .eq('active', true),
        supabase
          .from('door_style_finishes')
          .select('*')
          .eq('active', true),
        supabase
          .from('colors')
          .select('*')
          .eq('active', true),
        supabase
          .from('cabinet_types')
          .select('*')
          .eq('id', cabinetTypeId)
          .single()
      ]);

      if (rangesRes.data) setPriceRanges(rangesRes.data as any);
      if (finishesRes.data) setCabinetTypeFinishes(finishesRes.data as any);
      if (doorStylesRes.data) setAllDoorStyles(doorStylesRes.data);
      if (doorStyleFinishesRes.data) setAllDoorStyleFinishes(doorStyleFinishesRes.data as DoorStyleFinish[]);
      if (colorsRes.data) setAllColors(colorsRes.data);
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

  const addFinishCombination = async () => {
    const newMapping = {
      cabinet_type_id: cabinetTypeId,
      depth_mm: cabinetType?.default_depth_mm || 560,
      sort_order: cabinetTypeFinishes.length,
      active: true
    };

    const { data, error } = await supabase
      .from('cabinet_type_finishes' as any)
      .insert(newMapping)
      .select(`
        *,
        door_style_finish:door_style_finishes(*),
        door_style:door_styles(*),
        color:colors(*)
      `)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add finish combination",
        variant: "destructive",
      });
      return;
    }

    if (data) {
      setCabinetTypeFinishes([...cabinetTypeFinishes, data as any]);
    }
  };

  const updateFinishMapping = async (id: string, updates: { doorStyleFinishId?: string | null; doorStyleId?: string | null; colorId?: string | null; depthMm?: number | null }) => {
    const updateData: any = {};
    if (updates.doorStyleFinishId !== undefined) updateData.door_style_finish_id = updates.doorStyleFinishId;
    if (updates.doorStyleId !== undefined) updateData.door_style_id = updates.doorStyleId;
    if (updates.colorId !== undefined) updateData.color_id = updates.colorId;
    if (updates.depthMm !== undefined) updateData.depth_mm = updates.depthMm;

    const { error } = await supabase
      .from('cabinet_type_finishes' as any)
      .update(updateData)
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update finish combination",
        variant: "destructive",
      });
      return;
    }

    fetchData(); // Refresh to get updated data
  };

  const deleteFinishMapping = async (id: string) => {
    const { error } = await supabase
      .from('cabinet_type_finishes' as any)
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete finish combination",
        variant: "destructive",
      });
      return;
    }

    setCabinetTypeFinishes(cabinetTypeFinishes.filter(ctf => ctf.id !== id));
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

  const getAvailableFinishes = (doorStyleId?: string) => {
    if (!doorStyleId) return [];
    return allDoorStyleFinishes.filter(finish => finish.door_style_id === doorStyleId);
  };

  const getAvailableColors = (doorStyleId?: string) => {
    if (!doorStyleId) return [];
    return allColors.filter(color => color.door_style_id === doorStyleId);
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

      {/* Finish Combinations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Finish Combinations</CardTitle>
          <Button onClick={addFinishCombination} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Combination
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Door Style</TableHead>
                <TableHead>Finish</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Depth (mm)</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cabinetTypeFinishes.map((ctf) => {
                const availableFinishes = getAvailableFinishes(ctf.door_style_id || undefined);
                const availableColors = getAvailableColors(ctf.door_style_id || undefined);
                return (
                  <TableRow key={ctf.id}>
                    <TableCell>
                      <Select
                        value={ctf.door_style_id || "none"}
                        onValueChange={(value) => updateFinishMapping(ctf.id, { doorStyleId: value === "none" ? null : value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select door style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No door style</SelectItem>
                          {allDoorStyles.map(style => (
                            <SelectItem key={style.id} value={style.id}>
                              {style.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={ctf.door_style_finish_id || "none"}
                        onValueChange={(value) => updateFinishMapping(ctf.id, { doorStyleFinishId: value === "none" ? null : value })}
                        disabled={!ctf.door_style_id}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select finish" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No finish</SelectItem>
                          {availableFinishes.map(finish => (
                            <SelectItem key={finish.id} value={finish.id}>
                              {finish.name} (${finish.rate_per_sqm}/sqm)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={ctf.color_id || "none"}
                        onValueChange={(value) => updateFinishMapping(ctf.id, { colorId: value === "none" ? null : value })}
                        disabled={!ctf.door_style_id}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select color" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No color</SelectItem>
                          {availableColors.map(color => (
                            <SelectItem key={color.id} value={color.id}>
                              {color.name} (+${color.surcharge_rate_per_sqm}/sqm)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={ctf.depth_mm || cabinetType?.default_depth_mm || 560}
                        onChange={(e) => updateFinishMapping(ctf.id, { depthMm: parseInt(e.target.value) })}
                        placeholder="Depth in mm"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => deleteFinishMapping(ctf.id)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}