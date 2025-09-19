import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, GripVertical, RotateCcw, Eye } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CabinetType {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  display_order: number;
  subcategory_display_order?: number;
  active: boolean;
}

interface SortableItemProps {
  cabinet: CabinetType;
}

const SortableItem: React.FC<SortableItemProps> = ({ cabinet }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cabinet.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-card border rounded-lg ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab hover:cursor-grabbing p-1"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{cabinet.name}</span>
          {cabinet.subcategory && (
            <Badge variant="secondary" className="text-xs">
              {cabinet.subcategory}
            </Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          Display Order: {cabinet.display_order}
          {cabinet.subcategory_display_order && 
            ` • Subcategory Order: ${cabinet.subcategory_display_order}`
          }
        </div>
      </div>
    </div>
  );
};

interface CategorySectionProps {
  category: string;
  cabinets: CabinetType[];
  onReorder: (cabinetIds: string[]) => void;
  isUpdating: boolean;
  onResetOrder: () => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  cabinets,
  onReorder,
  isUpdating,
  onResetOrder,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = cabinets.findIndex(cabinet => cabinet.id === active.id);
      const newIndex = cabinets.findIndex(cabinet => cabinet.id === over.id);

      const newOrder = arrayMove(cabinets, oldIndex, newIndex);
      onReorder(newOrder.map(cabinet => cabinet.id));
    }
  };

  const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1) + ' Cabinets';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{categoryTitle}</CardTitle>
            <CardDescription>
              Drag and drop to reorder how cabinets appear on shop and price list pages
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onResetOrder}
              disabled={isUpdating}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Alphabetical
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {cabinets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No {category} cabinets found
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={cabinets.map(c => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {cabinets.map((cabinet) => (
                  <SortableItem key={cabinet.id} cabinet={cabinet} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
};

export const CabinetManagement: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('base');
  const queryClient = useQueryClient();

  // Fetch cabinets by category
  const { data: cabinets, isLoading } = useQuery({
    queryKey: ['admin-cabinets', activeCategory],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cabinet_types')
        .select('*')
        .eq('category', activeCategory)
        .eq('active', true)
        .order('display_order')
        .order('subcategory_display_order')
        .order('name');

      if (error) throw error;
      return data as CabinetType[];
    },
  });

  // Update cabinet order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async (updates: { id: string; display_order: number }[]) => {
      const promises = updates.map(update =>
        supabase
          .from('cabinet_types')
          .update({ display_order: update.display_order })
          .eq('id', update.id)
      );

      const results = await Promise.all(promises);
      
      // Check for errors
      results.forEach(result => {
        if (result.error) throw result.error;
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cabinets'] });
      toast.success('Cabinet order updated successfully');
    },
    onError: (error) => {
      console.error('Error updating cabinet order:', error);
      toast.error('Failed to update cabinet order');
    },
  });

  // Reset to alphabetical order mutation
  const resetOrderMutation = useMutation({
    mutationFn: async (category: string) => {
      // Fetch cabinets sorted alphabetically
      const { data, error } = await supabase
        .from('cabinet_types')
        .select('id, name')
        .eq('category', category)
        .eq('active', true)
        .order('name');

      if (error) throw error;

      // Update display_order based on alphabetical position
      const updates = data.map((cabinet, index) => ({
        id: cabinet.id,
        display_order: index + 1,
      }));

      const promises = updates.map(update =>
        supabase
          .from('cabinet_types')
          .update({ display_order: update.display_order })
          .eq('id', update.id)
      );

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cabinets'] });
      toast.success('Cabinet order reset to alphabetical');
    },
    onError: (error) => {
      console.error('Error resetting cabinet order:', error);
      toast.error('Failed to reset cabinet order');
    },
  });

  const handleReorder = (cabinetIds: string[]) => {
    if (!cabinets) return;

    const updates = cabinetIds.map((id, index) => ({
      id,
      display_order: index + 1,
    }));

    updateOrderMutation.mutate(updates);
  };

  const handleResetOrder = () => {
    resetOrderMutation.mutate(activeCategory);
  };

  const categories = [
    { value: 'base', label: 'Base Cabinets' },
    { value: 'wall', label: 'Wall Cabinets' },
    { value: 'pantry', label: 'Pantry Cabinets' },
    { value: 'panels', label: 'Dress Panels' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cabinet Management</h2>
          <p className="text-muted-foreground">
            Manage the display order of cabinets across shop and price list pages
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          Preview Changes
        </Button>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-4">
          {categories.map(category => (
            <TabsTrigger key={category.value} value={category.value}>
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category.value} value={category.value}>
            <CategorySection
              category={category.value}
              cabinets={cabinets || []}
              onReorder={handleReorder}
              isUpdating={updateOrderMutation.isPending || resetOrderMutation.isPending}
              onResetOrder={handleResetOrder}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default CabinetManagement;