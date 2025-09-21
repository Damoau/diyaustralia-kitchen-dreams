import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DoorStyle, Finish, DoorStyleFinish } from '@/types/cabinet';
import { Plus, Save, Trash2, Settings } from 'lucide-react';

export const DoorStyleFinishManager: React.FC = () => {
  const [doorStyles, setDoorStyles] = useState<DoorStyle[]>([]);
  const [finishes, setFinishes] = useState<Finish[]>([]);
  const [doorStyleFinishes, setDoorStyleFinishes] = useState<DoorStyleFinish[]>([]);
  const [selectedDoorStyle, setSelectedDoorStyle] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [doorStylesRes, finishesRes, relationshipsRes] = await Promise.all([
        supabase.from('door_styles').select('*').eq('active', true).order('name'),
        supabase.from('finishes').select('*, door_style:door_styles(*)').eq('active', true).order('name'),
        supabase.from('door_style_finishes').select('*').eq('active', true)
      ]);

      if (doorStylesRes.error) throw doorStylesRes.error;
      if (finishesRes.error) throw finishesRes.error;
      if (relationshipsRes.error) throw relationshipsRes.error;

      setDoorStyles(doorStylesRes.data || []);
      setFinishes(finishesRes.data || []);
      setDoorStyleFinishes(relationshipsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleFinishToggle = async (finishId: string, isChecked: boolean) => {
    if (!selectedDoorStyle) return;

    try {
      if (isChecked) {
        // Add relationship
        const { error } = await supabase
          .from('door_style_finishes')
          .insert([{
            door_style_id: selectedDoorStyle,
            finish_id: finishId,
            active: true
          }]);

        if (error) throw error;
        toast.success('Finish added to door style');
      } else {
        // Remove relationship
        const { error } = await supabase
          .from('door_style_finishes')
          .delete()
          .eq('door_style_id', selectedDoorStyle)
          .eq('finish_id', finishId);

        if (error) throw error;
        toast.success('Finish removed from door style');
      }

      // Reload relationships
      const { data } = await supabase
        .from('door_style_finishes')
        .select('*')
        .eq('active', true);
      
      setDoorStyleFinishes(data || []);
    } catch (error) {
      console.error('Error updating relationship:', error);
      toast.error('Failed to update finish relationship');
    }
  };

  const isFinishLinked = (finishId: string): boolean => {
    return doorStyleFinishes.some(
      dsf => dsf.door_style_id === selectedDoorStyle && dsf.finish_id === finishId
    );
  };

  const getFinishesByDoorStyle = (doorStyleId: string) => {
    return finishes.filter(finish => finish.door_style_id === doorStyleId);
  };

  const selectedDoorStyleObj = doorStyles.find(ds => ds.id === selectedDoorStyle);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Door Style & Finish Relationships
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Door Style Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Door Style</label>
            <Select value={selectedDoorStyle} onValueChange={setSelectedDoorStyle}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a door style to manage finishes..." />
              </SelectTrigger>
              <SelectContent>
                {doorStyles.map((doorStyle) => (
                  <SelectItem key={doorStyle.id} value={doorStyle.id}>
                    {doorStyle.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Finish Management */}
          {selectedDoorStyle && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Available Finishes for "{selectedDoorStyleObj?.name}"
            </h3>
                <Badge variant="outline">
                  {doorStyleFinishes.filter(dsf => dsf.door_style_id === selectedDoorStyle).length} finishes selected
                </Badge>
              </div>

              {/* Group finishes by door style */}
              <div className="space-y-6">
                {doorStyles.map((doorStyle) => {
                  const doorStyleFinishes = getFinishesByDoorStyle(doorStyle.id);
                  if (doorStyleFinishes.length === 0) return null;

                  return (
                    <Card key={doorStyle.id} className="border-l-4 border-l-primary/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base text-primary">
                          {doorStyle.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {doorStyleFinishes.map((finish) => (
                            <div
                              key={finish.id}
                              className="flex items-center space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                            >
                              <Checkbox
                                id={finish.id}
                                checked={isFinishLinked(finish.id)}
                                onCheckedChange={(checked) => 
                                  handleFinishToggle(finish.id, checked as boolean)
                                }
                              />
                              <div className="flex-1 min-w-0">
                                <label
                                  htmlFor={finish.id}
                                  className="text-sm font-medium cursor-pointer"
                                >
                                  {finish.name}
                                </label>
                                <p className="text-xs text-muted-foreground">
                                  {finish.finish_type} • +${finish.rate_per_sqm}/m²
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {!selectedDoorStyle && (
            <div className="text-center py-12 text-muted-foreground">
              <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a door style above to manage its available finishes</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};