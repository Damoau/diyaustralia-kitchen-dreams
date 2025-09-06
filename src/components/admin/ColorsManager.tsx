import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Edit, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DoorStyle, Color } from '@/types/cabinet';

interface DoorStyleFinishType {
  id: string;
  door_style_id: string;
  finish_name: string;
  sort_order: number;
  active: boolean;
}

interface ColorFinish {
  id: string;
  color_id: string;
  door_style_finish_type_id: string;
  rate_per_sqm: number;
  active: boolean;
}

interface ExtendedColor extends Color {
  door_style?: DoorStyle;
  finishes?: ColorFinish[];
}

export function ColorsManager() {
  const { toast } = useToast();
  const [doorStyles, setDoorStyles] = useState<DoorStyle[]>([]);
  const [colors, setColors] = useState<ExtendedColor[]>([]);
  const [finishTypes, setFinishTypes] = useState<DoorStyleFinishType[]>([]);
  const [colorFinishes, setColorFinishes] = useState<ColorFinish[]>([]);
  const [selectedDoorStyle, setSelectedDoorStyle] = useState<string>('');
  const [editingColor, setEditingColor] = useState<ExtendedColor | null>(null);
  const [editingFinishTypes, setEditingFinishTypes] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [doorStylesRes, colorsRes, finishTypesRes, colorFinishesRes] = await Promise.all([
        supabase.from('door_styles').select('*').eq('active', true).order('name'),
        supabase.from('colors').select(`
          *,
          door_styles!colors_door_style_id_fkey(*)
        `).eq('active', true).order('name'),
        supabase.from('door_style_finish_types').select('*').eq('active', true).order('door_style_id, sort_order'),
        supabase.from('color_finishes').select('*').eq('active', true)
      ]);

      if (doorStylesRes.data) setDoorStyles(doorStylesRes.data);
      if (colorsRes.data) {
        const extendedColors = colorsRes.data.map(color => ({
          ...color,
          door_style: color.door_styles
        }));
        setColors(extendedColors);
      }
      if (finishTypesRes.data) setFinishTypes(finishTypesRes.data);
      if (colorFinishesRes.data) setColorFinishes(colorFinishesRes.data);

      if (doorStylesRes.data && doorStylesRes.data.length > 0) {
        setSelectedDoorStyle(doorStylesRes.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const addColor = async (doorStyleId: string) => {
    const newColor = {
      name: "New Color",
      hex_code: "#FFFFFF",
      door_style_id: doorStyleId,
      surcharge_rate_per_sqm: 0,
      active: true
    };

    const { data, error } = await supabase
      .from('colors')
      .insert(newColor)
      .select('*')
      .single();

    if (error) {
      toast({ title: "Error", description: "Failed to add color", variant: "destructive" });
      return;
    }

    fetchData();
  };

  const updateColor = async (id: string, updates: Partial<Color>) => {
    const { error } = await supabase.from('colors').update(updates).eq('id', id);
    if (error) {
      toast({ title: "Error", description: "Failed to update color", variant: "destructive" });
      return;
    }
    setColors(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteColor = async (id: string) => {
    const { error } = await supabase.from('colors').delete().eq('id', id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete color", variant: "destructive" });
      return;
    }
    setColors(colors.filter(color => color.id !== id));
  };

  const addFinishType = async (doorStyleId: string) => {
    const newFinishType = {
      door_style_id: doorStyleId,
      finish_name: "New Finish",
      sort_order: 0,
      active: true
    };

    const { error } = await supabase.from('door_style_finish_types').insert(newFinishType);
    if (error) {
      toast({ title: "Error", description: "Failed to add finish type", variant: "destructive" });
      return;
    }
    fetchData();
  };

  const updateFinishType = async (id: string, updates: Partial<DoorStyleFinishType>) => {
    const { error } = await supabase.from('door_style_finish_types').update(updates).eq('id', id);
    if (error) {
      toast({ title: "Error", description: "Failed to update finish type", variant: "destructive" });
      return;
    }
    setFinishTypes(prev => prev.map(ft => ft.id === id ? { ...ft, ...updates } : ft));
  };

  const deleteFinishType = async (id: string) => {
    const { error } = await supabase.from('door_style_finish_types').delete().eq('id', id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete finish type", variant: "destructive" });
      return;
    }
    fetchData();
  };

  const toggleColorFinish = async (colorId: string, finishTypeId: string, enabled: boolean) => {
    if (enabled) {
      const { error } = await supabase.from('color_finishes').insert({
        color_id: colorId,
        door_style_finish_type_id: finishTypeId,
        rate_per_sqm: 0,
        active: true
      });
      if (error) {
        toast({ title: "Error", description: "Failed to add color finish", variant: "destructive" });
        return;
      }
    } else {
      const { error } = await supabase
        .from('color_finishes')
        .delete()
        .eq('color_id', colorId)
        .eq('door_style_finish_type_id', finishTypeId);
      if (error) {
        toast({ title: "Error", description: "Failed to remove color finish", variant: "destructive" });
        return;
      }
    }
    fetchData();
  };

  const getColorsForDoorStyle = (doorStyleId: string) => {
    return colors.filter(color => color.door_style_id === doorStyleId);
  };

  const getFinishTypesForDoorStyle = (doorStyleId: string) => {
    return finishTypes.filter(ft => ft.door_style_id === doorStyleId);
  };

  const isColorFinishEnabled = (colorId: string, finishTypeId: string) => {
    return colorFinishes.some(cf => cf.color_id === colorId && cf.door_style_finish_type_id === finishTypeId);
  };

  if (loading) {
    return <div>Loading colors...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs value={selectedDoorStyle} onValueChange={setSelectedDoorStyle}>
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${doorStyles.length}, 1fr)` }}>
          {doorStyles.map(doorStyle => (
            <TabsTrigger key={doorStyle.id} value={doorStyle.id}>
              {doorStyle.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {doorStyles.map(doorStyle => (
          <TabsContent key={doorStyle.id} value={doorStyle.id}>
            <div className="space-y-6">
              {/* Finish Types Management */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between py-3">
                  <CardTitle className="text-lg">Finish Types for {doorStyle.name}</CardTitle>
                  <Button onClick={() => addFinishType(doorStyle.id)} size="sm" className="h-7 text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Finish Type
                  </Button>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {getFinishTypesForDoorStyle(doorStyle.id).map(finishType => (
                      <div key={finishType.id} className="flex items-center space-x-2 p-2 border rounded bg-muted/30">
                        <Input
                          value={finishType.finish_name}
                          onChange={(e) => {
                            setFinishTypes(prev => prev.map(ft => ft.id === finishType.id ? { ...ft, finish_name: e.target.value } : ft));
                          }}
                          onBlur={(e) => {
                            updateFinishType(finishType.id, { finish_name: e.target.value });
                          }}
                          className="flex-1 h-7 text-xs"
                          placeholder="Finish name"
                        />
                        <Input
                          type="number"
                          value={finishType.sort_order}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setFinishTypes(prev => prev.map(ft => ft.id === finishType.id ? { ...ft, sort_order: val } : ft));
                          }}
                          onBlur={(e) => {
                            updateFinishType(finishType.id, { sort_order: parseInt(e.target.value) || 0 });
                          }}
                          className="w-12 h-7 text-xs"
                          placeholder="#"
                        />
                        <Button
                          onClick={() => deleteFinishType(finishType.id)}
                          variant="destructive"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Colors Management */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Colors for {doorStyle.name}</CardTitle>
                  <Button onClick={() => addColor(doorStyle.id)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Color
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {getColorsForDoorStyle(doorStyle.id).map(color => (
                      <div key={color.id} className="border rounded-lg p-3 space-y-2 bg-card flex-shrink-0 w-64">
                        {/* Color Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-6 h-6 rounded border flex-shrink-0"
                              style={{ backgroundColor: color.hex_code || '#ccc' }}
                            />
                            <Input
                              value={color.name}
                              onChange={(e) => {
                                setColors(prev => prev.map(c => c.id === color.id ? { ...c, name: e.target.value } : c));
                              }}
                              onBlur={(e) => updateColor(color.id, { name: e.target.value })}
                              className="h-7 text-sm font-medium flex-1 min-w-0"
                            />
                          </div>
                          <Button
                            onClick={() => deleteColor(color.id)}
                            variant="destructive"
                            size="sm"
                            className="h-6 w-6 p-0 flex-shrink-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Color Details */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Hex Code</Label>
                            <Input
                              value={color.hex_code || ''}
                              onChange={(e) => {
                                setColors(prev => prev.map(c => c.id === color.id ? { ...c, hex_code: e.target.value } : c));
                              }}
                              onBlur={(e) => updateColor(color.id, { hex_code: e.target.value })}
                              placeholder="#FFFFFF"
                              className="h-7 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Surcharge ($/sqm)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={color.surcharge_rate_per_sqm}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                setColors(prev => prev.map(c => c.id === color.id ? { ...c, surcharge_rate_per_sqm: Number.isNaN(val) ? 0 : val } : c));
                              }}
                              onBlur={(e) => {
                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                updateColor(color.id, { surcharge_rate_per_sqm: Number.isNaN(val) ? 0 : val });
                              }}
                              className="h-7 text-xs"
                            />
                          </div>
                        </div>
                        
                        {/* Available Finishes - Compact */}
                        {getFinishTypesForDoorStyle(doorStyle.id).length > 0 && (
                          <div>
                            <Label className="text-xs font-medium">Finishes</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {getFinishTypesForDoorStyle(doorStyle.id).map(finishType => (
                                <div key={finishType.id} className="flex items-center space-x-1">
                                  <Checkbox
                                    id={`${color.id}-${finishType.id}`}
                                    checked={isColorFinishEnabled(color.id, finishType.id)}
                                    onCheckedChange={(checked) => toggleColorFinish(color.id, finishType.id, checked as boolean)}
                                    className="h-3 w-3"
                                  />
                                  <Label htmlFor={`${color.id}-${finishType.id}`} className="text-xs">
                                    {finishType.finish_name}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}