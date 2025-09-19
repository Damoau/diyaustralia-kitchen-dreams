import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { DataTable } from '@/components/admin/shared/DataTable';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  Settings,
  Wrench,
  Ruler
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

interface CabinetPart {
  id: string;
  cabinet_type_id: string;
  part_name: string;
  quantity: number;
  width_formula?: string;
  height_formula?: string;
  is_door: boolean;
  is_hardware: boolean;
}

const CabinetManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('types');
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

  // Fetch cabinet parts
  const { data: cabinetParts, isLoading: loadingParts } = useQuery({
    queryKey: ['admin-cabinet-parts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cabinet_parts')
        .select(`
          *,
          cabinet_types (
            name,
            category
          )
        `)
        .order('cabinet_type_id')
        .order('part_name');
      
      if (error) throw error;
      return data as CabinetPart[];
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
  ];

  // Cabinet parts columns
  const cabinetPartsColumns = [
    {
      key: 'cabinet_type_id' as keyof CabinetPart,
      label: 'Cabinet Type',
      render: (value: string, item: CabinetPart) => (
        <span>{(item as any).cabinet_types?.name || 'Unknown'}</span>
      ),
    },
    {
      key: 'cabinet_type_id' as keyof CabinetPart,
      label: 'Category',
      render: (value: string, item: CabinetPart) => (
        <Badge variant="outline">{(item as any).cabinet_types?.category || 'Unknown'}</Badge>
      ),
    },
    {
      key: 'part_name' as keyof CabinetPart,
      label: 'Part Name',
    },
    {
      key: 'quantity' as keyof CabinetPart,
      label: 'Quantity',
    },
    {
      key: 'width_formula' as keyof CabinetPart,
      label: 'Width Formula',
      render: (value: string) => (
        <code className="text-xs bg-muted px-1 py-0.5 rounded">
          {value || 'N/A'}
        </code>
      ),
    },
    {
      key: 'height_formula' as keyof CabinetPart,
      label: 'Height Formula',
      render: (value: string) => (
        <code className="text-xs bg-muted px-1 py-0.5 rounded">
          {value || 'N/A'}
        </code>
      ),
    },
    {
      key: 'is_door' as keyof CabinetPart,
      label: 'Door Part',
      render: (value: boolean) => (
        value ? <Badge>Yes</Badge> : <span className="text-muted-foreground">No</span>
      ),
    },
    {
      key: 'is_hardware' as keyof CabinetPart,
      label: 'Hardware',
      render: (value: boolean) => (
        value ? <Badge>Yes</Badge> : <span className="text-muted-foreground">No</span>
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
            Manage cabinet types, dimensions, and part formulas
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="types" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Cabinet Types
          </TabsTrigger>
          <TabsTrigger value="parts" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Parts & Formulas
          </TabsTrigger>
          <TabsTrigger value="hardware" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Hardware Requirements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="types">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Cabinet Types</CardTitle>
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
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parts">
          <Card>
            <CardHeader>
              <CardTitle>Cabinet Parts & Formulas</CardTitle>
              <CardDescription>
                View and manage part dimensions and calculation formulas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={cabinetPartsColumns}
                data={cabinetParts || []}
                loading={loadingParts}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hardware">
          <Card>
            <CardHeader>
              <CardTitle>Hardware Requirements</CardTitle>
              <CardDescription>
                Hardware specifications and requirements for each cabinet type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Hardware requirements management coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CabinetManager;