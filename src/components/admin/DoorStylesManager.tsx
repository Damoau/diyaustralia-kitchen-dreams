import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Save, Plus, Edit, Trash2, Palette, DollarSign, Upload, X } from 'lucide-react';
import { ImageDropzone } from './ImageDropzone';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';

interface DoorStyle {
  id?: string;
  name: string;
  description?: string;
  base_rate_per_sqm: number;
  image_url?: string;
  active: boolean;
}

interface Color {
  id?: string;
  name: string;
  hex_code?: string;
  image_url?: string;
  door_style_id?: string;
  surcharge_rate_per_sqm: number;
  sort_order: number;
  active: boolean;
}

interface DoorStyleFinish {
  id?: string;
  door_style_id: string;
  name: string;
  rate_per_sqm: number;
  sort_order: number;
  active: boolean;
}

export const DoorStylesManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('door-styles');
  const [editingDoorStyle, setEditingDoorStyle] = useState<DoorStyle | null>(null);
  const [editingColor, setEditingColor] = useState<Color | null>(null);
  const [editingFinish, setEditingFinish] = useState<DoorStyleFinish | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const queryClient = useQueryClient();

  // Fetch door styles
  const { data: doorStyles, isLoading: loadingDoorStyles } = useQuery({
    queryKey: ['door-styles-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('door_styles')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as DoorStyle[];
    },
  });

  // Fetch colors
  const { data: colors, isLoading: loadingColors } = useQuery({
    queryKey: ['colors-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('colors')
        .select(`
          *,
          door_styles (name)
        `)
        .order('door_style_id', { nullsFirst: false })
        .order('sort_order')
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  // Fetch door style finishes
  const { data: finishes, isLoading: loadingFinishes } = useQuery({
    queryKey: ['door-style-finishes-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('door_style_finishes')
        .select(`
          *,
          door_styles (name)
        `)
        .order('door_style_id')
        .order('sort_order')
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  // Mutations
  const saveDoorStyleMutation = useMutation({
    mutationFn: async (doorStyle: DoorStyle) => {
      if (doorStyle.id) {
        const { data, error } = await supabase
          .from('door_styles')
          .update(doorStyle)
          .eq('id', doorStyle.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('door_styles')
          .insert(doorStyle)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['door-styles-admin'] });
      toast.success('Door style saved successfully');
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error('Failed to save door style: ' + error.message);
    },
  });

  const saveColorMutation = useMutation({
    mutationFn: async (color: Color) => {
      if (color.id) {
        const { data, error } = await supabase
          .from('colors')
          .update(color)
          .eq('id', color.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('colors')
          .insert(color)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colors-admin'] });
      toast.success('Color saved successfully');
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error('Failed to save color: ' + error.message);
    },
  });

  const saveFinishMutation = useMutation({
    mutationFn: async (finish: DoorStyleFinish) => {
      if (finish.id) {
        const { data, error } = await supabase
          .from('door_style_finishes')
          .update(finish)
          .eq('id', finish.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('door_style_finishes')
          .insert(finish)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['door-style-finishes-admin'] });
      toast.success('Finish saved successfully');
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error('Failed to save finish: ' + error.message);
    },
  });

  const deleteDoorStyleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('door_styles')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['door-styles-admin'] });
      toast.success('Door style deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete door style: ' + error.message);
    },
  });

  const deleteColorMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('colors')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colors-admin'] });
      toast.success('Color deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete color: ' + error.message);
    },
  });

  const deleteFinishMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('door_style_finishes')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['door-style-finishes-admin'] });
      toast.success('Finish deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete finish: ' + error.message);
    },
  });

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingDoorStyle(null);
    setEditingColor(null);
    setEditingFinish(null);
  };

  const handleNewDoorStyle = () => {
    setEditingDoorStyle({
      name: '',
      description: '',
      base_rate_per_sqm: 0,
      image_url: '',
      active: true,
    });
    setDialogOpen(true);
  };

  const handleNewColor = () => {
    setEditingColor({
      name: '',
      hex_code: '#FFFFFF',
      image_url: '',
      door_style_id: '',
      surcharge_rate_per_sqm: 0,
      sort_order: 0,
      active: true,
    });
    setDialogOpen(true);
  };

  const handleNewFinish = () => {
    setEditingFinish({
      door_style_id: doorStyles?.[0]?.id || '',
      name: '',
      rate_per_sqm: 0,
      sort_order: 0,
      active: true,
    });
    setDialogOpen(true);
  };

  const handleSaveDoorStyle = () => {
    if (editingDoorStyle) {
      saveDoorStyleMutation.mutate(editingDoorStyle);
    }
  };

  const handleSaveColor = () => {
    if (editingColor) {
      saveColorMutation.mutate(editingColor);
    }
  };

  const handleSaveFinish = () => {
    if (editingFinish) {
      saveFinishMutation.mutate(editingFinish);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    // Find the dragged item
    const doorStyle = doorStyles?.find(style => style.id === active.id);
    const color = colors?.find(color => color.id === active.id);
    const finish = finishes?.find(finish => finish.id === active.id);
    
    setDraggedItem(doorStyle || color || finish);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && over.id === 'dialog-drop-zone') {
      const doorStyle = doorStyles?.find(style => style.id === active.id);
      const color = colors?.find(color => color.id === active.id);
      const finish = finishes?.find(finish => finish.id === active.id);
      
      if (doorStyle) {
        setEditingDoorStyle(doorStyle);
        setDialogOpen(true);
      } else if (color) {
        setEditingColor(color);
        setDialogOpen(true);
      } else if (finish) {
        setEditingFinish(finish);
        setDialogOpen(true);
      }
    }
    
    setActiveId(null);
    setDraggedItem(null);
  };

// Draggable Components
const DraggableDoorStyleCard = ({ style }: { style: DoorStyle }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: style.id!,
  });

  const style_transform = transform
    ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
    : undefined;

  return (
     <Card
       ref={setNodeRef}
       style={{ transform: style_transform }}
       className={`cursor-pointer hover:shadow-md transition-all ${
         isDragging ? 'opacity-50 z-50' : ''
       }`}
       {...listeners}
       {...attributes}
     >
       <CardHeader className="pb-3">
         <div className="flex items-center justify-between">
           <CardTitle className="text-lg">{style.name}</CardTitle>
           <div className="flex gap-1">
             <Badge variant={style.active ? "default" : "secondary"}>
               {style.active ? "Active" : "Inactive"}
             </Badge>
             <Button
               variant="outline"
               size="sm"
               onClick={(e) => {
                 e.stopPropagation();
                 setEditingDoorStyle(style);
                 setDialogOpen(true);
               }}
             >
               <Edit className="h-4 w-4" />
             </Button>
             <Button
               variant="outline"
               size="sm"
               onClick={(e) => {
                 e.stopPropagation();
                 deleteDoorStyleMutation.mutate(style.id!);
               }}
             >
               <Trash2 className="h-4 w-4" />
             </Button>
           </div>
         </div>
       </CardHeader>
       <CardContent>
         {style.image_url && (
           <div className="mb-3">
             <img
               src={style.image_url}
               alt={style.name}
               className="w-full h-32 object-cover rounded-lg border"
             />
           </div>
         )}
         <div className="space-y-2 text-sm">
           <div className="flex justify-between">
             <span className="text-muted-foreground">Base Rate:</span>
             <span className="font-medium">${style.base_rate_per_sqm}/sqm</span>
           </div>
           {style.description && (
             <p className="text-muted-foreground">{style.description}</p>
           )}
         </div>
       </CardContent>
     </Card>
  );
};

const DraggableColorCard = ({ color }: { color: any }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: color.id,
  });

  const style = transform
    ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
    : undefined;

  return (
     <Card
       ref={setNodeRef}
       style={{ transform: style }}
       className={`cursor-pointer hover:shadow-md transition-all ${
         isDragging ? 'opacity-50 z-50' : ''
       }`}
       {...listeners}
       {...attributes}
     >
       <CardHeader className="pb-3">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             {color.hex_code && (
               <div
                 className="w-6 h-6 rounded border-2 border-border"
                 style={{ backgroundColor: color.hex_code }}
               />
             )}
             <CardTitle className="text-lg">{color.name}</CardTitle>
           </div>
           <div className="flex gap-1">
             <Button
               variant="outline"
               size="sm"
               onClick={(e) => {
                 e.stopPropagation();
                 setEditingColor(color);
                 setDialogOpen(true);
               }}
             >
               <Edit className="h-4 w-4" />
             </Button>
             <Button
               variant="outline"
               size="sm"
               onClick={(e) => {
                 e.stopPropagation();
                 deleteColorMutation.mutate(color.id);
               }}
             >
               <Trash2 className="h-4 w-4" />
             </Button>
           </div>
         </div>
         {color.door_styles?.name && (
           <Badge variant="outline">{color.door_styles.name}</Badge>
         )}
       </CardHeader>
       <CardContent>
         {color.image_url && (
           <div className="mb-3">
             <img
               src={color.image_url}
               alt={color.name}
               className="w-full h-32 object-cover rounded-lg border"
             />
           </div>
         )}
         <div className="space-y-2 text-sm">
           <div className="flex justify-between">
             <span className="text-muted-foreground">Surcharge:</span>
             <span className="font-medium">${color.surcharge_rate_per_sqm}/sqm</span>
           </div>
           <div className="flex justify-between">
             <span className="text-muted-foreground">Sort Order:</span>
             <span>{color.sort_order}</span>
           </div>
         </div>
       </CardContent>
     </Card>
  );
};

// Droppable Dialog Component
const DroppableDialog = ({
  dialogOpen,
  onOpenChange,
  editingDoorStyle,
  editingColor,
  editingFinish,
  doorStyles,
  onDoorStyleChange,
  onColorChange,
  onFinishChange,
  onSaveDoorStyle,
  onSaveColor,
  onSaveFinish,
  onClose,
  saveDoorStyleMutation,
  saveColorMutation,
  saveFinishMutation,
}: any) => {
  const { isOver, setNodeRef } = useDroppable({
    id: 'dialog-drop-zone',
  });

  return (
    <Dialog open={dialogOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" ref={setNodeRef}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {editingDoorStyle && (editingDoorStyle.id ? 'Edit Door Style' : 'New Door Style')}
            {editingColor && (editingColor.id ? 'Edit Color' : 'New Color')}
            {editingFinish && (editingFinish.id ? 'Edit Finish' : 'New Finish')}
          </DialogTitle>
          <DialogDescription>
            {isOver ? (
              <span className="text-primary font-medium animate-pulse">
                Drop here to edit this item! 🎯
              </span>
            ) : (
              "Manage door styles, colors, and finishes used in pricing calculations. You can also drag and drop items here."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className={`transition-all duration-200 ${isOver ? 'bg-primary/5 border-2 border-primary border-dashed rounded-lg p-4' : ''}`}>
          {/* Door Style Form */}
          {editingDoorStyle && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="door-style-name">Name</Label>
                  <Input
                    id="door-style-name"
                    value={editingDoorStyle.name}
                    onChange={(e) => onDoorStyleChange({ ...editingDoorStyle, name: e.target.value })}
                    placeholder="Enter door style name"
                  />
                </div>
                <div>
                  <Label htmlFor="door-style-rate">Base Rate ($/sqm)</Label>
                  <Input
                    id="door-style-rate"
                    type="number"
                    step="0.01"
                    value={editingDoorStyle.base_rate_per_sqm}
                    onChange={(e) => onDoorStyleChange({ ...editingDoorStyle, base_rate_per_sqm: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="door-style-description">Description</Label>
                <Textarea
                  id="door-style-description"
                  value={editingDoorStyle.description || ''}
                  onChange={(e) => onDoorStyleChange({ ...editingDoorStyle, description: e.target.value })}
                  placeholder="Enter description (optional)"
                />
              </div>
               <div>
                 <Label htmlFor="door-style-image">Door Style Image</Label>
                 <ImageDropzone
                   value={editingDoorStyle.image_url || ''}
                   onChange={(url) => onDoorStyleChange({ ...editingDoorStyle, image_url: url })}
                 />
                 <Input
                   className="mt-2"
                   placeholder="Or enter image URL manually"
                   value={editingDoorStyle.image_url || ''}
                   onChange={(e) => onDoorStyleChange({ ...editingDoorStyle, image_url: e.target.value })}
                 />
               </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="door-style-active"
                  checked={editingDoorStyle.active}
                  onCheckedChange={(checked) => onDoorStyleChange({ ...editingDoorStyle, active: checked })}
                />
                <Label htmlFor="door-style-active">Active</Label>
              </div>
            </div>
          )}

          {/* Color Form */}
          {editingColor && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="color-name">Name</Label>
                  <Input
                    id="color-name"
                    value={editingColor.name}
                    onChange={(e) => onColorChange({ ...editingColor, name: e.target.value })}
                    placeholder="Enter color name"
                  />
                </div>
                <div>
                  <Label htmlFor="color-hex">Hex Code</Label>
                  <Input
                    id="color-hex"
                    value={editingColor.hex_code || ''}
                    onChange={(e) => onColorChange({ ...editingColor, hex_code: e.target.value })}
                    placeholder="#FFFFFF"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="color-surcharge">Surcharge Rate ($/sqm)</Label>
                  <Input
                    id="color-surcharge"
                    type="number"
                    step="0.01"
                    value={editingColor.surcharge_rate_per_sqm}
                    onChange={(e) => onColorChange({ ...editingColor, surcharge_rate_per_sqm: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="color-sort">Sort Order</Label>
                  <Input
                    id="color-sort"
                    type="number"
                    value={editingColor.sort_order}
                    onChange={(e) => onColorChange({ ...editingColor, sort_order: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="color-door-style">Door Style (Optional)</Label>
                <select
                  id="color-door-style"
                  className="w-full px-3 py-2 border border-input bg-background rounded-md"
                  value={editingColor.door_style_id || ''}
                  onChange={(e) => onColorChange({ ...editingColor, door_style_id: e.target.value || undefined })}
                >
                  <option value="">Available for all door styles</option>
                  {doorStyles?.map((style: any) => (
                    <option key={style.id} value={style.id}>{style.name}</option>
                  ))}
                </select>
              </div>
               <div>
                 <Label htmlFor="color-image">Color Image</Label>
                 <ImageDropzone
                   value={editingColor.image_url || ''}
                   onChange={(url) => onColorChange({ ...editingColor, image_url: url })}
                 />
                 <Input
                   className="mt-2"
                   placeholder="Or enter image URL manually"
                   value={editingColor.image_url || ''}
                   onChange={(e) => onColorChange({ ...editingColor, image_url: e.target.value })}
                 />
               </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="color-active"
                  checked={editingColor.active}
                  onCheckedChange={(checked) => onColorChange({ ...editingColor, active: checked })}
                />
                <Label htmlFor="color-active">Active</Label>
              </div>
            </div>
          )}

          {/* Finish Form */}
          {editingFinish && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="finish-name">Name</Label>
                  <Input
                    id="finish-name"
                    value={editingFinish.name}
                    onChange={(e) => onFinishChange({ ...editingFinish, name: e.target.value })}
                    placeholder="Enter finish name"
                  />
                </div>
                <div>
                  <Label htmlFor="finish-rate">Rate ($/sqm)</Label>
                  <Input
                    id="finish-rate"
                    type="number"
                    step="0.01"
                    value={editingFinish.rate_per_sqm}
                    onChange={(e) => onFinishChange({ ...editingFinish, rate_per_sqm: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="finish-door-style">Door Style</Label>
                <select
                  id="finish-door-style"
                  className="w-full px-3 py-2 border border-input bg-background rounded-md"
                  value={editingFinish.door_style_id}
                  onChange={(e) => onFinishChange({ ...editingFinish, door_style_id: e.target.value })}
                >
                  {doorStyles?.map((style: any) => (
                    <option key={style.id} value={style.id}>{style.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="finish-sort">Sort Order</Label>
                <Input
                  id="finish-sort"
                  type="number"
                  value={editingFinish.sort_order}
                  onChange={(e) => onFinishChange({ ...editingFinish, sort_order: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="finish-active"
                  checked={editingFinish.active}
                  onCheckedChange={(checked) => onFinishChange({ ...editingFinish, active: checked })}
                />
                <Label htmlFor="finish-active">Active</Label>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          {editingDoorStyle && (
            <Button onClick={onSaveDoorStyle} disabled={saveDoorStyleMutation.isPending}>
              {saveDoorStyleMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              Save Door Style
            </Button>
          )}
          {editingColor && (
            <Button onClick={onSaveColor} disabled={saveColorMutation.isPending}>
              {saveColorMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              Save Color
            </Button>
          )}
          {editingFinish && (
            <Button onClick={onSaveFinish} disabled={saveFinishMutation.isPending}>
              {saveFinishMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              Save Finish
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DraggableFinishCard = ({ finish }: { finish: any }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: finish.id,
  });

  const style = transform
    ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
    : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={{ transform: style }}
      className={`cursor-pointer hover:shadow-md transition-all ${
        isDragging ? 'opacity-50 z-50' : ''
      }`}
      {...listeners}
      {...attributes}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{finish.name}</CardTitle>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setEditingFinish(finish);
                setDialogOpen(true);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                deleteFinishMutation.mutate(finish.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Badge variant="outline">{finish.door_styles?.name}</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rate:</span>
            <span className="font-medium">${finish.rate_per_sqm}/sqm</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sort Order:</span>
            <span>{finish.sort_order}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Door Styles & Colors Management</h2>
            <p className="text-muted-foreground">
              Manage door styles, colors, and finishes used in cabinet pricing formulas
            </p>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Door Styles</p>
                      <p className="text-2xl font-bold">{doorStyles?.length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-secondary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Colors</p>
                      <p className="text-2xl font-bold">{colors?.length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-accent" />
                    <div>
                      <p className="text-sm text-muted-foreground">Finishes</p>
                      <p className="text-2xl font-bold">{finishes?.length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="door-styles">Door Styles</TabsTrigger>
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="finishes">Finishes</TabsTrigger>
          </TabsList>

          <TabsContent value="door-styles">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Door Styles
                    </CardTitle>
                    <CardDescription>
                      Base door styles with pricing per square meter. Drag and drop to edit in popup.
                    </CardDescription>
                  </div>
                  <Button onClick={handleNewDoorStyle}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Door Style
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingDoorStyles ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {doorStyles?.map((style) => (
                      <DraggableDoorStyleCard key={style.id} style={style} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="colors">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Colors
                    </CardTitle>
                    <CardDescription>
                      Color options with surcharge rates. Drag and drop to edit in popup.
                    </CardDescription>
                  </div>
                  <Button onClick={handleNewColor}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Color
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingColors ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {colors?.map((color: any) => (
                      <DraggableColorCard key={color.id} color={color} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="finishes">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Door Style Finishes
                    </CardTitle>
                    <CardDescription>
                      Additional finish options for specific door styles. Drag and drop to edit in popup.
                    </CardDescription>
                  </div>
                  <Button onClick={handleNewFinish}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Finish
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingFinishes ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {finishes?.map((finish: any) => (
                      <DraggableFinishCard key={finish.id} finish={finish} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DroppableDialog
          dialogOpen={dialogOpen}
          onOpenChange={setDialogOpen}
          editingDoorStyle={editingDoorStyle}
          editingColor={editingColor}
          editingFinish={editingFinish}
          doorStyles={doorStyles}
          onDoorStyleChange={setEditingDoorStyle}
          onColorChange={setEditingColor}
          onFinishChange={setEditingFinish}
          onSaveDoorStyle={handleSaveDoorStyle}
          onSaveColor={handleSaveColor}
          onSaveFinish={handleSaveFinish}
          onClose={handleCloseDialog}
          saveDoorStyleMutation={saveDoorStyleMutation}
          saveColorMutation={saveColorMutation}
          saveFinishMutation={saveFinishMutation}
        />

        <DragOverlay>
          {activeId && draggedItem && (
            <div className="opacity-90 rotate-6 animate-pulse">
              {draggedItem.base_rate_per_sqm !== undefined ? (
                <DraggableDoorStyleCard style={draggedItem} />
              ) : draggedItem.surcharge_rate_per_sqm !== undefined ? (
                <DraggableColorCard color={draggedItem} />
              ) : (
                <DraggableFinishCard finish={draggedItem} />
              )}
            </div>
          )}
        </DragOverlay>
      </div>
    </DndContext>
  );
};

export default DoorStylesManager;