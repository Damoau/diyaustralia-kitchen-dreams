import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Plus, 
  Edit, 
  Trash2, 
  GripVertical, 
  Tags, 
  FolderOpen,
  Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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

interface Category {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  active: boolean;
  sort_order: number;
  icon?: string;
  created_at: string;
}

interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  display_name: string;
  description?: string;
  active: boolean;
  sort_order: number;
  icon?: string;
  categories?: {
    name: string;
    display_name: string;
  };
}

interface SortableItemProps {
  item: Category | Subcategory;
  onEdit: (item: Category | Subcategory) => void;
  onDelete: (id: string) => void;
  type: 'category' | 'subcategory';
}

const SortableItem: React.FC<SortableItemProps> = ({ item, onEdit, onDelete, type }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-4 bg-card border rounded-lg ${
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
          <span className="font-medium">{item.display_name}</span>
          <Badge variant="outline" className="text-xs">
            {item.name}
          </Badge>
          {item.active ? (
            <Badge>Active</Badge>
          ) : (
            <Badge variant="secondary">Inactive</Badge>
          )}
        </div>
        {item.description && (
          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
        )}
        <div className="text-xs text-muted-foreground mt-1">
          Sort Order: {item.sort_order}
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(item)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export const CategoriesManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('categories');
  const [editingItem, setEditingItem] = useState<Category | Subcategory | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      return data as Category[];
    },
  });

  // Fetch subcategories
  const { data: subcategories, isLoading: loadingSubcategories } = useQuery({
    queryKey: ['admin-subcategories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subcategories')
        .select(`
          *,
          categories (name, display_name)
        `)
        .order('sort_order');
      
      if (error) throw error;
      return data as Subcategory[];
    },
  });

  // Mutations
  const saveCategoryMutation = useMutation({
    mutationFn: async (category: Partial<Category>) => {
      if (category.id) {
        const { error } = await supabase
          .from('categories')
          .update(category)
          .eq('id', category.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([category as any]); // Cast to any for insert
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success('Category saved successfully');
      setIsDialogOpen(false);
      setEditingItem(null);
    },
  });

  const saveSubcategoryMutation = useMutation({
    mutationFn: async (subcategory: Partial<Subcategory>) => {
      if (subcategory.id) {
        const { error } = await supabase
          .from('subcategories')
          .update(subcategory)
          .eq('id', subcategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('subcategories')
          .insert([subcategory as any]); // Cast to any for insert
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subcategories'] });
      toast.success('Subcategory saved successfully');
      setIsDialogOpen(false);
      setEditingItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: 'category' | 'subcategory' }) => {
      const table = type === 'category' ? 'categories' : 'subcategories';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { type }) => {
      queryClient.invalidateQueries({ 
        queryKey: type === 'category' ? ['admin-categories'] : ['admin-subcategories'] 
      });
      toast.success(`${type === 'category' ? 'Category' : 'Subcategory'} deleted successfully`);
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const items = (activeTab === 'categories' ? categories : subcategories) as any[];
    if (!items) return;

    const oldIndex = items.findIndex(item => item.id === active.id);
    const newIndex = items.findIndex(item => item.id === over.id);

    const newOrder = arrayMove(items, oldIndex, newIndex);
    
    // Update sort orders
    const updates = newOrder.map((item, index) => ({
      id: item.id,
      sort_order: index,
    }));

    const table = activeTab === 'categories' ? 'categories' : 'subcategories';
    
    Promise.all(
      updates.map(update =>
        supabase
          .from(table)
          .update({ sort_order: update.sort_order })
          .eq('id', update.id)
      )
    ).then(() => {
      queryClient.invalidateQueries({ 
        queryKey: activeTab === 'categories' ? ['admin-categories'] : ['admin-subcategories'] 
      });
      toast.success('Order updated successfully');
    });
  };

  const handleEdit = (item: Category | Subcategory) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const type = activeTab === 'categories' ? 'category' : 'subcategory';
    if (confirm(`Are you sure you want to delete this ${type}?`)) {
      deleteMutation.mutate({ id, type });
    }
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Categories & Subcategories</h2>
          <p className="text-muted-foreground">
            Manage product categories and subcategories used for filtering
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Tags className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="subcategories" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Subcategories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Product Categories</CardTitle>
                  <CardDescription>
                    Main categories for organizing products (Base, Wall, Pantry, etc.)
                  </CardDescription>
                </div>
                <Button onClick={handleAddNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingCategories ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : categories && categories.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={categories.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <SortableItem
                          key={category.id}
                          item={category}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          type="category"
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No categories found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subcategories">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Subcategories</CardTitle>
                  <CardDescription>
                    Sub-categories within each main category (Doors, Drawers, etc.)
                  </CardDescription>
                </div>
                <Button onClick={handleAddNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subcategory
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingSubcategories ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : subcategories && subcategories.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={subcategories.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {subcategories.map((subcategory) => (
                        <SortableItem
                          key={subcategory.id}
                          item={subcategory}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          type="subcategory"
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No subcategories found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CategoryEditDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        item={editingItem}
        type={activeTab as 'categories' | 'subcategories'}
        categories={categories || []}
        onSave={(data) => {
          if (activeTab === 'categories') {
            saveCategoryMutation.mutate(data);
          } else {
            saveSubcategoryMutation.mutate(data);
          }
        }}
        isLoading={saveCategoryMutation.isPending || saveSubcategoryMutation.isPending}
      />
    </div>
  );
};

interface CategoryEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Category | Subcategory | null;
  type: 'categories' | 'subcategories';
  categories: Category[];
  onSave: (data: any) => void;
  isLoading: boolean;
}

const CategoryEditDialog: React.FC<CategoryEditDialogProps> = ({
  open,
  onOpenChange,
  item,
  type,
  categories,
  onSave,
  isLoading
}) => {
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    active: true,
    category_id: '',
    icon: '',
  });

  React.useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        display_name: item.display_name,
        description: item.description || '',
        active: item.active,
        category_id: 'category_id' in item ? item.category_id : '',
        icon: item.icon || '',
      });
    } else {
      setFormData({
        name: '',
        display_name: '',
        description: '',
        active: true,
        category_id: '',
        icon: '',
      });
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data: any = { ...formData };
    if (item) {
      data.id = item.id;
    }
    if (type === 'categories') {
      delete data.category_id;
    }
    
    onSave(data);
  };

  const isCategory = type === 'categories';
  const title = `${item ? 'Edit' : 'Create'} ${isCategory ? 'Category' : 'Subcategory'}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isCategory 
              ? 'Categories are used to group products on the frontend'
              : 'Subcategories provide additional filtering within categories'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Internal Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., base, wall"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name *</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="e.g., Base Cabinets"
                required
              />
            </div>
          </div>

          {!isCategory && (
            <div className="space-y-2">
              <Label htmlFor="category_id">Parent Category *</Label>
              <select
                id="category_id"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="">Select category...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.display_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description for admin reference"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
            />
            <Label htmlFor="active">Active (visible to users)</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {item ? 'Update' : 'Create'} {isCategory ? 'Category' : 'Subcategory'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoriesManager;