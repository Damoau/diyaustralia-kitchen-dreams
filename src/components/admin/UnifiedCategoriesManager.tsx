import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Pencil, Plus, Trash2, Folder, FolderOpen, Package } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Category {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  parent_id?: string;
  level: number; // 1 = Room (Kitchen), 2 = Type (Base), 3 = Sub (Doors)
  sort_order: number;
  active: boolean;
  hero_image_url?: string;
  created_at: string;
  children?: Category[];
}

interface CategoryFormData {
  name: string;
  display_name: string;
  description: string;
  parent_id: string;
  level: number;
  sort_order: number;
  active: boolean;
  hero_image_url: string;
}

const initialFormData: CategoryFormData = {
  name: '',
  display_name: '',
  description: '',
  parent_id: '',
  level: 1,
  sort_order: 0,
  active: true,
  hero_image_url: '',
};

const LEVEL_NAMES = {
  1: 'Room Category',
  2: 'Cabinet Type', 
  3: 'Subcategory',
};

export const UnifiedCategoriesManager: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(initialFormData);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const queryClient = useQueryClient();

  // Fetch all categories with hierarchy
  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-unified-categories'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('unified_categories')
        .select('*')
        .order('level')
        .order('sort_order');
      
      if (error) throw error;
      
      // Build hierarchy
      const categoryMap = new Map<string, Category>();
      const rootCategories: Category[] = [];
      
      (data || []).forEach((cat: any) => {
        categoryMap.set(cat.id, { ...cat, children: [] });
      });
      
      (data || []).forEach((cat: any) => {
        const category = categoryMap.get(cat.id)!;
        if (cat.parent_id) {
          const parent = categoryMap.get(cat.parent_id);
          if (parent) {
            parent.children!.push(category);
          }
        } else {
          rootCategories.push(category);
        }
      });
      
      return rootCategories;
    },
  });

  // Get flat list for parent selection
  const { data: flatCategories, refetch: refetchFlatCategories } = useQuery({
    queryKey: ['admin-flat-categories'],
    queryFn: async () => {
      console.log('Fetching flat categories...');
      const { data, error } = await (supabase as any)
        .from('unified_categories')
        .select('*')
        .eq('active', true)
        .order('level')
        .order('sort_order');
      
      if (error) {
        console.error('Error fetching flat categories:', error);
        throw error;
      }
      console.log('Fetched flat categories:', data?.length || 0, 'items');
      return (data || []) as Category[];
    },
    staleTime: 0, // Always consider data stale
    refetchOnWindowFocus: true,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const { error } = await (supabase as any)
        .from('unified_categories')
        .insert([data]);
      
      if (error) throw error;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['admin-unified-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-flat-categories'] });
      // Force refetch the flat categories to ensure dropdown updates immediately
      await refetchFlatCategories();
      toast.success('Category created successfully');
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error(`Failed to create category: ${error.message}`);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CategoryFormData }) => {
      const { error } = await (supabase as any)
        .from('unified_categories')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-unified-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-flat-categories'] });
      // Force refetch the flat categories to ensure dropdown updates
      queryClient.refetchQueries({ queryKey: ['admin-flat-categories'] });
      toast.success('Category updated successfully');
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error(`Failed to update category: ${error.message}`);
    },
  });

  // Toggle visibility mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await (supabase as any)
        .from('unified_categories')
        .update({ active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-unified-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-flat-categories'] });
      toast.success('Category visibility updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update category visibility: ${error.message}`);
    },
  });

  const toggleCategoryVisibility = (id: string, active: boolean) => {
    toggleVisibilityMutation.mutate({ id, active });
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('unified_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-unified-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-flat-categories'] });
      // Force refetch the flat categories to ensure dropdown updates
      queryClient.refetchQueries({ queryKey: ['admin-flat-categories'] });
      toast.success('Category deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete category: ${error.message}`);
    },
  });

  const handleOpenDialog = (item?: Category, level: number = 1) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        display_name: item.display_name,
        description: item.description || '',
        parent_id: item.parent_id || '',
        level: item.level,
        sort_order: item.sort_order,
        active: item.active,
        hero_image_url: item.hero_image_url || '',
      });
    } else {
      setEditingItem(null);
      setFormData({
        ...initialFormData,
        level: level,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData(initialFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare data for submission, converting empty parent_id to null
    const submitData = {
      ...formData,
      parent_id: formData.parent_id === '' ? null : formData.parent_id,
      hero_image_url: formData.hero_image_url === '' ? null : formData.hero_image_url
    };
    
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this category and all its children?')) {
      deleteMutation.mutate(id);
    }
  };

  const renderCategoryTree = (cats: Category[], indent: number = 0) => {
    return cats.map((category) => (
      <React.Fragment key={category.id}>
               <TableRow className="h-12">
          <TableCell className="py-2">
            <div className="flex items-center" style={{ paddingLeft: `${indent * 16}px` }}>
              {category.level === 1 && <Folder className="h-3 w-3 mr-1 text-blue-600" />}
              {category.level === 2 && <FolderOpen className="h-3 w-3 mr-1 text-green-600" />}
              {category.level === 3 && <Package className="h-3 w-3 mr-1 text-orange-600" />}
              <span className="font-mono text-xs">{category.name}</span>
            </div>
          </TableCell>
          <TableCell className="font-medium py-2 text-sm">{category.display_name}</TableCell>
          <TableCell className="py-2">
            <span className={`px-1.5 py-0.5 rounded text-xs ${
              category.level === 1 ? 'bg-blue-100 text-blue-800' :
              category.level === 2 ? 'bg-green-100 text-green-800' :
              'bg-orange-100 text-orange-800'
            }`}>
              {LEVEL_NAMES[category.level as keyof typeof LEVEL_NAMES]}
            </span>
          </TableCell>
          <TableCell className="max-w-xs truncate py-2 text-xs">{category.description}</TableCell>
          <TableCell className="py-2 text-sm">{category.sort_order}</TableCell>
          <TableCell className="py-2">
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
              category.active 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
            }`}>
              {category.active ? 'Active' : 'Inactive'}
            </span>
          </TableCell>
          <TableCell className="py-2">
            <div className="flex items-center gap-1">
              <Button
                variant={category.active ? "outline" : "default"}
                size="sm"
                onClick={() => toggleCategoryVisibility(category.id, !category.active)}
                className={`h-7 px-2 text-xs ${category.active ? "" : "bg-orange-100 text-orange-800 hover:bg-orange-200"}`}
              >
                {category.active ? "Hide" : "Show"}
              </Button>
              {category.level < 3 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenDialog(undefined, category.level + 1)}
                  title={`Add ${LEVEL_NAMES[(category.level + 1) as keyof typeof LEVEL_NAMES]}`}
                  className="h-7 w-7 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenDialog(category)}
                className="h-7 w-7 p-0"
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(category.id)}
                disabled={deleteMutation.isPending}
                className="h-7 w-7 p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
        {category.children && category.children.length > 0 && renderCategoryTree(category.children, indent + 1)}
      </React.Fragment>
    ));
  };

  const getParentOptions = () => {
    if (!flatCategories) return [];
    
    console.log('FormData level:', formData.level);
    console.log('Flat categories:', flatCategories.length);
    
    const parents = flatCategories
      .filter(cat => cat.level < formData.level)
      .filter(cat => cat.level === formData.level - 1) // Only direct parents
      .map(cat => {
        // For Level 2 categories, find their parent room name
        if (cat.level === 2 && cat.parent_id) {
          const roomParent = flatCategories.find(room => room.id === cat.parent_id);
          return {
            ...cat,
            display_name: roomParent ? `${cat.display_name} (${roomParent.display_name})` : cat.display_name
          };
        }
        return cat;
      });
    
    console.log('Parent options:', parents);
    return parents;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Unified Category System</h2>
          <p className="text-muted-foreground">
            Manage all categories in one place: Room Categories → Cabinet Types → Subcategories
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleOpenDialog(undefined, 1)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Room Category
          </Button>
          <Button onClick={() => handleOpenDialog(undefined, 2)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Cabinet Type
          </Button>
          <Button onClick={() => handleOpenDialog(undefined, 3)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Subcategory
          </Button>
        </div>
      </div>

      {/* Explanation */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="p-3 border rounded">
              <div className="flex items-center gap-2 mb-2">
                <Folder className="h-4 w-4 text-blue-600" />
                <strong>Level 1: Room Categories</strong>
              </div>
              <p className="text-muted-foreground">Kitchen, Laundry, Vanity, Wardrobe, Outdoor Kitchen</p>
              <p className="text-xs mt-1">Creates: /shop/kitchen</p>
            </div>
            <div className="p-3 border rounded">
              <div className="flex items-center gap-2 mb-2">
                <FolderOpen className="h-4 w-4 text-green-600" />
                <strong>Level 2: Cabinet Types</strong>
              </div>
              <p className="text-muted-foreground">Base, Wall, Pantry, Specialty</p>
              <p className="text-xs mt-1">Creates: /shop/kitchen/base</p>
            </div>
            <div className="p-3 border rounded">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-orange-600" />
                <strong>Level 3: Subcategories</strong>
              </div>
              <p className="text-muted-foreground">Doors, Drawers, Shelving</p>
              <p className="text-xs mt-1">For filtering within types</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Category' : `Add ${LEVEL_NAMES[formData.level as keyof typeof LEVEL_NAMES]}`}
            </DialogTitle>
            <DialogDescription>
              {formData.level === 1 && "Room categories create the main navigation (Kitchen, Laundry, etc.)"}
              {formData.level === 2 && "Cabinet types organize products within each room (Base, Wall, etc.)"}
              {formData.level === 3 && "Subcategories provide additional filtering options"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name (URL slug)</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="kitchen, base, doors"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="Kitchen Cabinets"
                  required
                />
              </div>
            </div>

            {formData.level > 1 && (
              <div className="space-y-2">
                <Label htmlFor="parent_id">Parent Category</Label>
                <Select value={formData.parent_id} onValueChange={(value) => setFormData({ ...formData, parent_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent category" />
                  </SelectTrigger>
                  <SelectContent>
                    {getParentOptions().map((parent) => (
                      <SelectItem key={parent.id} value={parent.id}>
                        {parent.display_name} ({parent.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description of this category..."
                rows={2}
              />
            </div>

            {formData.level === 1 && (
              <div className="space-y-2">
                <Label htmlFor="hero_image_url">Hero Image URL</Label>
                <Input
                  id="hero_image_url"
                  value={formData.hero_image_url}
                  onChange={(e) => setFormData({ ...formData, hero_image_url: e.target.value })}
                  placeholder="/src/assets/hero-kitchen.jpg"
                />
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Category Hierarchy</CardTitle>
          <CardDescription>
            All categories organized in a tree structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : categories && categories.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Sort</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {renderCategoryTree(categories)}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              No categories found. Start by adding a Room Category.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedCategoriesManager;