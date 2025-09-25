import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { DataTable } from '@/components/admin/shared/DataTable';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package,
  Filter
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
  room_category_id?: string;
  room_categories?: { name: string } | null;
}

interface RoomCategory {
  id: string;
  name: string;
  display_name: string;
}


const CabinetManager: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Filter states
  const [roomFilter, setRoomFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Fetch room categories
  const { data: roomCategories } = useQuery({
    queryKey: ['room-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('room_categories')
        .select('id, name, display_name')
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      return data as RoomCategory[];
    },
  });

  // Fetch cabinet types
  const { data: cabinetTypes, isLoading: loadingTypes } = useQuery({
    queryKey: ['admin-cabinet-types'],
    queryFn: async () => {
      console.log('Fetching cabinet types...');
      const { data, error } = await supabase
        .from('cabinet_types')
        .select('*')
        .order('category', { ascending: true })
        .order('display_order', { ascending: true });
      
      console.log('Cabinet types query result:', { data, error });
      if (error) {
        console.error('Cabinet types query error:', error);
        throw error;
      }
      return data as any[];
    },
  });

  // Filter cabinet types based on filters
  const filteredCabinetTypes = cabinetTypes?.filter(cabinet => {
    if (roomFilter !== 'all' && cabinet.room_category_id !== roomFilter) return false;
    if (categoryFilter !== 'all' && cabinet.category !== categoryFilter) return false;
    if (subcategoryFilter !== 'all' && cabinet.subcategory !== subcategoryFilter) return false;
    if (searchFilter && !cabinet.name.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    return true;
  }) || [];

  // Get unique categories and subcategories from filtered data
  const uniqueCategories = [...new Set(cabinetTypes?.map(c => c.category) || [])];
  const uniqueSubcategories = [...new Set(cabinetTypes?.filter(c => c.subcategory).map(c => c.subcategory) || [])];

  // Reset dependent filters when parent filter changes
  const handleRoomFilterChange = (value: string) => {
    setRoomFilter(value);
    setCategoryFilter('all');
    setSubcategoryFilter('all');
  };

  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value);
    setSubcategoryFilter('all');
  };


  // Cabinet type columns for DataTable
  const cabinetTypeColumns = [
    {
      key: 'name' as keyof CabinetType,
      label: 'Name',
    },
    {
      key: 'room_categories' as keyof CabinetType,
      label: 'Room',
      render: (value: any) => (
        value?.name ? <Badge variant="outline">{value.name}</Badge> : '-'
      ),
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
          onClick={() => navigate(`/admin/cabinets/${item.id}`)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      ),
    },
  ];


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
    navigate('/admin/cabinets/new');
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
          
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search cabinets..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Room</label>
              <Select value={roomFilter} onValueChange={handleRoomFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Rooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rooms</SelectItem>
                  {roomCategories?.map(room => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={categoryFilter} onValueChange={handleCategoryFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories?.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subcategory</label>
              <Select value={subcategoryFilter} onValueChange={setSubcategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Subcategories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subcategories</SelectItem>
                  {uniqueSubcategories?.map(subcategory => (
                    <SelectItem key={subcategory} value={subcategory}>
                      {subcategory}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={cabinetTypeColumns}
            data={filteredCabinetTypes}
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

    </div>
  );
};

export default CabinetManager;