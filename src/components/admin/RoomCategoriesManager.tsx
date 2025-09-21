import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Pencil, Plus, Trash2, Home, Package } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface RoomCategory {
  id: string;
  name: string;
  display_name: string;
  description: string;
  hero_image_url?: string;
  sort_order: number;
  active: boolean;
  created_at: string;
}

interface RoomCategoryFormData {
  name: string;
  display_name: string;
  description: string;
  hero_image_url: string;
  sort_order: number;
  active: boolean;
}

const initialFormData: RoomCategoryFormData = {
  name: '',
  display_name: '',
  description: '',
  hero_image_url: '',
  sort_order: 0,
  active: true,
};

export const RoomCategoriesManager: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RoomCategory | null>(null);
  const [formData, setFormData] = useState<RoomCategoryFormData>(initialFormData);
  const queryClient = useQueryClient();

  // Fetch room categories
  const { data: roomCategories, isLoading } = useQuery({
    queryKey: ['admin-room-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('room_categories')
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      return data as RoomCategory[];
    },
  });

  // Create room category mutation
  const createMutation = useMutation({
    mutationFn: async (data: RoomCategoryFormData) => {
      const { error } = await supabase
        .from('room_categories')
        .insert([data]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-room-categories'] });
      toast.success('Room category created successfully');
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error(`Failed to create room category: ${error.message}`);
    },
  });

  // Update room category mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RoomCategoryFormData }) => {
      const { error } = await supabase
        .from('room_categories')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-room-categories'] });
      toast.success('Room category updated successfully');
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error(`Failed to update room category: ${error.message}`);
    },
  });

  // Delete room category mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('room_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-room-categories'] });
      toast.success('Room category deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete room category: ${error.message}`);
    },
  });

  const handleOpenDialog = (item?: RoomCategory) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        display_name: item.display_name,
        description: item.description,
        hero_image_url: item.hero_image_url || '',
        sort_order: item.sort_order,
        active: item.active,
      });
    } else {
      setEditingItem(null);
      setFormData(initialFormData);
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
    
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this room category?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Room Categories</h2>
          <p className="text-muted-foreground">
            Manage room categories (Kitchen, Laundry, Vanity, etc.) used for organizing cabinet collections
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Room Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit Room Category' : 'Add Room Category'}
              </DialogTitle>
              <DialogDescription>
                Room categories are used to group cabinet collections on the frontend
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
                    placeholder="kitchen, laundry, vanity"
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
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description of this room category..."
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hero_image_url">Hero Image URL</Label>
                <Input
                  id="hero_image_url"
                  value={formData.hero_image_url}
                  onChange={(e) => setFormData({ ...formData, hero_image_url: e.target.value })}
                  placeholder="/src/assets/hero-kitchen.jpg"
                />
              </div>
              
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Room Categories
          </CardTitle>
          <CardDescription>
            Main room categories for organizing cabinet collections
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : roomCategories && roomCategories.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Sort Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roomCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-mono">{category.name}</TableCell>
                    <TableCell className="font-medium">{category.display_name}</TableCell>
                    <TableCell className="max-w-xs truncate">{category.description}</TableCell>
                    <TableCell>{category.sort_order}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        category.active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}>
                        {category.active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDialog(category)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(category.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              No room categories found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RoomCategoriesManager;