import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { DataTable } from '@/components/admin/shared/DataTable';
import { CabinetTypeEditDialog } from '@/components/admin/CabinetTypeEditDialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package
} from 'lucide-react';

interface CabinetType {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  default_width_mm: number;
  default_height_mm: number;
  default_depth_mm: number;
  min_width_mm?: number;
  max_width_mm?: number;
  min_height_mm?: number;
  max_height_mm?: number;
  min_depth_mm?: number;
  max_depth_mm?: number;
  door_count: number;
  drawer_count: number;
  active: boolean;
  short_description?: string;
  long_description?: string;
  product_image_url?: string;
  is_featured?: boolean;
  display_order?: number;
  created_at: string;
}


const CabinetManager: React.FC = () => {
  const [editingType, setEditingType] = useState<CabinetType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch cabinet types
  const { data: cabinetTypes, isLoading: loadingTypes } = useQuery({
    queryKey: ['admin-cabinet-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cabinet_types')
        .select('*')
        .order('category', { ascending: true })
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as CabinetType[];
    },
  });


  // Cabinet type columns for DataTable
  const cabinetTypeColumns = [
    {
      key: 'name' as keyof CabinetType,
      label: 'Name',
    },
    {
      key: 'category' as keyof CabinetType,
      label: 'Category',
      render: (value: string) => (
        <Badge variant="outline">{value}</Badge>
      ),
    },
    {
      key: 'subcategory' as keyof CabinetType,
      label: 'Subcategory',
      render: (value: string) => (
        value ? <Badge variant="secondary">{value}</Badge> : '-'
      ),
    },
    {
      key: 'default_width_mm' as keyof CabinetType,
      label: 'Width (mm)',
      render: (value: number) => `${value}mm`,
    },
    {
      key: 'default_height_mm' as keyof CabinetType,
      label: 'Height (mm)',
      render: (value: number) => `${value}mm`,
    },
    {
      key: 'default_depth_mm' as keyof CabinetType,
      label: 'Depth (mm)',
      render: (value: number) => `${value}mm`,
    },
    {
      key: 'door_count' as keyof CabinetType,
      label: 'Doors',
    },
    {
      key: 'drawer_count' as keyof CabinetType,
      label: 'Drawers',
    },
    {
      key: 'active' as keyof CabinetType,
      label: 'Status',
      render: (value: boolean) => (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'id' as keyof CabinetType,
      label: 'Actions',
      render: (value: string, item: CabinetType) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleEditType(item)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      ),
    },
  ];


  const handleEditType = (type: CabinetType) => {
    setEditingType(type);
    setIsDialogOpen(true);
  };

  const handleDeleteType = async (id: string) => {
    if (confirm('Are you sure you want to delete this cabinet type?')) {
      try {
        await supabase
          .from('cabinet_types')
          .delete()
          .eq('id', id);
        
        queryClient.invalidateQueries({ queryKey: ['admin-cabinet-types'] });
        toast.success('Cabinet type deleted successfully');
      } catch (error) {
        toast.error('Failed to delete cabinet type');
      }
    }
  };

  const handleAddNew = () => {
    setEditingType(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cabinet Management</h2>
          <p className="text-muted-foreground">
            Manage cabinet configurations, dimensions, parts, and hardware
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Cabinet Types
              </CardTitle>
              <CardDescription>
                Manage cabinet configurations, dimensions, and specifications
              </CardDescription>
            </div>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Cabinet Type
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={cabinetTypeColumns}
            data={cabinetTypes || []}
            loading={loadingTypes}
            actions={[
              {
                label: 'Delete',
                icon: <Trash2 className="h-4 w-4 mr-2" />,
                variant: 'destructive' as const,
                onClick: (item) => handleDeleteType(item.id),
              },
            ]}
          />
        </CardContent>
      </Card>

      <CabinetTypeEditDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        cabinetType={editingType}
      />
    </div>
  );
};

export default CabinetManager;