import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Filter,
  AlertCircle,
  Search
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
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Filter states
  const [roomFilter, setRoomFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [dataValidationIssues, setDataValidationIssues] = useState<string[]>([]);

  // Read URL parameters on mount
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch) {
      setSearchFilter(urlSearch);
    }
  }, [searchParams]);

  // Fetch room categories from unified_categories (level 1 = rooms)
  const { data: roomCategories } = useQuery({
    queryKey: ['room-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unified_categories')
        .select('id, name, display_name')
        .eq('active', true)
        .eq('level', 1)
        .order('sort_order');
      
      if (error) throw error;
      return data as RoomCategory[];
    },
  });

  // Fetch cabinet types
  const { data: cabinetTypes, isLoading: loadingTypes } = useQuery({
    queryKey: ['admin-cabinet-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cabinet_types')
        .select('*')
        .order('category', { ascending: true })
        .order('display_order', { ascending: true });
      
      if (error) {
        console.error('Cabinet types query error:', error);
        throw error;
      }
      return data as any[];
    },
  });

  // Improved search logic with better matching
  const normalizeSearchTerm = (term: string) => term.trim().toLowerCase().replace(/\s+/g, ' ');
  
  // Filter cabinet types based on filters
  const filteredCabinetTypes = cabinetTypes?.filter(cabinet => {
    if (roomFilter !== 'all' && cabinet.room_category_id !== roomFilter) return false;
    if (categoryFilter !== 'all' && cabinet.category !== categoryFilter) return false;
    if (subcategoryFilter !== 'all' && cabinet.subcategory !== subcategoryFilter) return false;
    
    // Improved search logic
    if (searchFilter) {
      const normalizedSearch = normalizeSearchTerm(searchFilter);
      const normalizedName = normalizeSearchTerm(cabinet.name);
      const normalizedCategory = normalizeSearchTerm(cabinet.category || '');
      const normalizedSubcategory = normalizeSearchTerm(cabinet.subcategory || '');
      
      // Check if search term matches name, category, subcategory, or door count
      const matchesName = normalizedName.includes(normalizedSearch);
      const matchesCategory = normalizedCategory.includes(normalizedSearch);
      const matchesSubcategory = normalizedSubcategory.includes(normalizedSearch);
      const matchesDoorCount = cabinet.door_count?.toString().includes(normalizedSearch);
      const matchesDrawerCount = cabinet.drawer_count?.toString().includes(normalizedSearch);
      
      if (!matchesName && !matchesCategory && !matchesSubcategory && !matchesDoorCount && !matchesDrawerCount) {
        return false;
      }
    }
    
    return true;
  }) || [];

  // Data validation: check for inconsistencies
  useEffect(() => {
    if (cabinetTypes) {
      const issues: string[] = [];
      
      cabinetTypes.forEach(cabinet => {
        // Check if door count matches name
        if (cabinet.name.toLowerCase().includes('door')) {
          const doorMatch = cabinet.name.match(/(\d+)\s*door/i);
          if (doorMatch) {
            const expectedDoors = parseInt(doorMatch[1]);
            if (cabinet.door_count !== expectedDoors) {
              issues.push(`"${cabinet.name}" has door_count: ${cabinet.door_count}, expected: ${expectedDoors}`);
            }
          }
        }
      });
      
      setDataValidationIssues(issues);
    }
  }, [cabinetTypes]);

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
      key: 'room_category_id' as keyof CabinetType,
      label: 'Room',
      render: (value: string) => {
        const room = roomCategories?.find(r => r.id === value);
        return room?.display_name ? <Badge variant="outline">{room.display_name}</Badge> : '-';
      },
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

  const handleSearchChange = (value: string) => {
    setSearchFilter(value);
    // Update URL to maintain search state
    const newSearchParams = new URLSearchParams(searchParams);
    if (value.trim()) {
      newSearchParams.set('search', value);
    } else {
      newSearchParams.delete('search');
    }
    setSearchParams(newSearchParams);
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
                <Badge variant="secondary" className="ml-2">
                  {filteredCabinetTypes.length} of {cabinetTypes?.length || 0}
                </Badge>
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
          
          {/* Data Validation Issues */}
          {dataValidationIssues.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">Data Validation Issues</span>
              </div>
              <ul className="text-sm text-yellow-700 space-y-1">
                {dataValidationIssues.map((issue, index) => (
                  <li key={index}>• {issue}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Active Filters Display */}
          {(searchFilter || roomFilter !== 'all' || categoryFilter !== 'all' || subcategoryFilter !== 'all') && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">Active Filters</span>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                {searchFilter && (
                  <Badge variant="outline" className="bg-white">
                    <Search className="h-3 w-3 mr-1" />
                    Search: "{searchFilter}"
                  </Badge>
                )}
                {roomFilter !== 'all' && (
                  <Badge variant="outline" className="bg-white">
                    Room: {roomCategories?.find(r => r.id === roomFilter)?.display_name || roomFilter}
                  </Badge>
                )}
                {categoryFilter !== 'all' && (
                  <Badge variant="outline" className="bg-white">
                    Category: {categoryFilter}
                  </Badge>
                )}
                {subcategoryFilter !== 'all' && (
                  <Badge variant="outline" className="bg-white">
                    Subcategory: {subcategoryFilter}
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search cabinets..."
                value={searchFilter}
                onChange={(e) => handleSearchChange(e.target.value)}
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
          {filteredCabinetTypes.length === 0 && !loadingTypes && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No cabinets found</h3>
              <p className="text-gray-500 mb-4">
                {searchFilter || roomFilter !== 'all' || categoryFilter !== 'all' || subcategoryFilter !== 'all'
                  ? 'No cabinets match your current filters.'
                  : 'No cabinets have been added yet.'}
              </p>
              {(searchFilter || roomFilter !== 'all' || categoryFilter !== 'all' || subcategoryFilter !== 'all') && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Try:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Clearing your search term</li>
                    <li>• Changing your filter selection</li>
                    <li>• Checking for spelling variations</li>
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {filteredCabinetTypes.length > 0 && (
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
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default CabinetManager;