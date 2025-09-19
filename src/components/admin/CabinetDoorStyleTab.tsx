import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Trash2, Palette, Link as LinkIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageDropzone } from './ImageDropzone';

interface CabinetTypeFinish {
  id: string;
  cabinet_type_id: string;
  door_style_id?: string;
  color_id?: string;
  door_style_finish_id?: string;
  image_url?: string;
  active: boolean;
  sort_order: number;
  door_styles?: {
    id: string;
    name: string;
    base_rate_per_sqm: number;
  };
  colors?: {
    id: string;
    name: string;
    surcharge_rate_per_sqm: number;
  };
}

interface CabinetDoorStyleTabProps {
  cabinetId: string;
}

export const CabinetDoorStyleTab: React.FC<CabinetDoorStyleTabProps> = ({ cabinetId }) => {
  const [isAddingFinish, setIsAddingFinish] = useState(false);
  const [newFinish, setNewFinish] = useState({
    door_style_id: '',
    color_id: '',
    image_url: '',
    active: true,
  });

  const queryClient = useQueryClient();

  // Fetch cabinet type finishes
  const { data: finishes, isLoading } = useQuery({
    queryKey: ['cabinet-type-finishes', cabinetId],
    queryFn: async () => {
      if (cabinetId === 'new') return [];
      
      const { data, error } = await supabase
        .from('cabinet_type_finishes')
        .select(`
          *,
          door_styles (id, name, base_rate_per_sqm),
          colors (id, name, surcharge_rate_per_sqm)
        `)
        .eq('cabinet_type_id', cabinetId)
        .order('sort_order');

      if (error) throw error;
      return data as CabinetTypeFinish[];
    },
    enabled: cabinetId !== 'new',
  });

  // Fetch available door styles
  const { data: doorStyles } = useQuery({
    queryKey: ['door-styles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('door_styles')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  // Fetch available colors
  const { data: colors } = useQuery({
    queryKey: ['colors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('colors')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  // Add finish mutation
  const addFinishMutation = useMutation({
    mutationFn: async (finish: typeof newFinish) => {
      // Get next sort order
      const { data: maxOrder } = await supabase
        .from('cabinet_type_finishes')
        .select('sort_order')
        .eq('cabinet_type_id', cabinetId)
        .order('sort_order', { ascending: false })
        .limit(1);

      const nextOrder = maxOrder && maxOrder.length > 0 ? maxOrder[0].sort_order + 1 : 0;

      const { error } = await supabase
        .from('cabinet_type_finishes')
        .insert([{ 
          ...finish, 
          cabinet_type_id: cabinetId,
          sort_order: nextOrder 
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cabinet-type-finishes'] });
      toast.success('Door style finish added');
      setIsAddingFinish(false);
      setNewFinish({
        door_style_id: '',
        color_id: '',
        image_url: '',
        active: true,
      });
    },
    onError: (error) => {
      console.error('Error adding finish:', error);
      toast.error('Failed to add door style finish');
    },
  });

  // Delete finish mutation
  const deleteFinishMutation = useMutation({
    mutationFn: async (finishId: string) => {
      const { error } = await supabase
        .from('cabinet_type_finishes')
        .delete()
        .eq('id', finishId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cabinet-type-finishes'] });
      toast.success('Door style finish removed');
    },
    onError: (error) => {
      console.error('Error deleting finish:', error);
      toast.error('Failed to remove door style finish');
    },
  });

  const handleAddFinish = () => {
    if (!newFinish.door_style_id) {
      toast.error('Door style is required');
      return;
    }
    addFinishMutation.mutate(newFinish);
  };

  if (cabinetId === 'new') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Door Styles & Finishes
          </CardTitle>
          <CardDescription>
            Save the cabinet first to configure available door styles and finishes
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Available Door Styles & Finishes
              </CardTitle>
              <CardDescription>
                Configure which door styles and color combinations are available for this cabinet
              </CardDescription>
            </div>
            <Dialog open={isAddingFinish} onOpenChange={setIsAddingFinish}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Door Style
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Door Style Finish</DialogTitle>
                  <DialogDescription>
                    Add a new door style and color combination for this cabinet
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Door Style *</label>
                      <Select 
                        value={newFinish.door_style_id} 
                        onValueChange={(value) => setNewFinish({ ...newFinish, door_style_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select door style" />
                        </SelectTrigger>
                        <SelectContent>
                          {doorStyles?.map(style => (
                            <SelectItem key={style.id} value={style.id}>
                              {style.name} (${style.base_rate_per_sqm}/m²)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Color (Optional)</label>
                      <Select 
                        value={newFinish.color_id} 
                        onValueChange={(value) => setNewFinish({ ...newFinish, color_id: value || '' })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select color" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No specific color</SelectItem>
                          {colors?.map(color => (
                            <SelectItem key={color.id} value={color.id}>
                              {color.name} (+${color.surcharge_rate_per_sqm}/m²)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cabinet Image</label>
                    <ImageDropzone
                      value={newFinish.image_url}
                      onChange={(url) => setNewFinish({ ...newFinish, image_url: url })}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newFinish.active}
                      onCheckedChange={(checked) => setNewFinish({ ...newFinish, active: checked })}
                    />
                    <label className="text-sm font-medium">Active (visible to customers)</label>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleAddFinish} disabled={addFinishMutation.isPending}>
                      Add Finish
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddingFinish(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading door styles...</div>
          ) : finishes && finishes.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {finishes.map((finish) => (
                <div key={finish.id} className="relative border rounded-lg overflow-hidden">
                  {finish.image_url && (
                    <div className="aspect-square bg-muted">
                      <img
                        src={finish.image_url}
                        alt="Cabinet finish"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">
                          {finish.door_styles?.name || 'Unknown Style'}
                        </h4>
                        {finish.colors && (
                          <p className="text-sm text-muted-foreground">
                            {finish.colors.name}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteFinishMutation.mutate(finish.id)}
                        disabled={deleteFinishMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      {finish.door_styles && (
                        <Badge variant="outline">
                          ${finish.door_styles.base_rate_per_sqm}/m²
                        </Badge>
                      )}
                      {finish.colors && finish.colors.surcharge_rate_per_sqm > 0 && (
                        <Badge variant="secondary">
                          +${finish.colors.surcharge_rate_per_sqm}/m²
                        </Badge>
                      )}
                      {finish.active ? (
                        <Badge>Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Palette className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No door style finishes configured yet</p>
              <p className="text-sm">Add door styles to show options to customers</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};