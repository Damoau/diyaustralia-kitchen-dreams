import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  MapPin, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Settings,
  Search,
  Target,
  Plus,
  Edit,
  Eye,
  EyeOff
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PostcodeZone {
  id: string;
  postcode: string;
  suburb?: string;
  state: string;
  zone: string;
  assembly_eligible: boolean;
  assembly_carcass_surcharge_pct: number;
  assembly_doors_surcharge_pct: number;
  assignment_method?: string;
  assigned_from_zone_id?: string;
}

interface AssemblyZone {
  id: string;
  zone_name: string;
  center_latitude: number;
  center_longitude: number;
  radius_km: number;
  carcass_surcharge_pct: number;
  doors_surcharge_pct: number;
  active: boolean;
  affected_postcodes_count?: number;
}

const UnifiedAssemblyManager = () => {
  const { toast } = useToast();
  const [postcodes, setPostcodes] = useState<PostcodeZone[]>([]);
  const [assemblyZones, setAssemblyZones] = useState<AssemblyZone[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'postcodes'>('postcodes');
  
  // Filters
  const [filters, setFilters] = useState({
    state: 'all',
    postcode: '',
    assemblyEligible: 'all'
  });
  
  // Edit postcode dialog
  const [editingPostcode, setEditingPostcode] = useState<PostcodeZone | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  // Create zone dialog
  const [showCreateZoneDialog, setShowCreateZoneDialog] = useState(false);
  const [isCreatingZone, setIsCreatingZone] = useState(false);
  const [newZoneData, setNewZoneData] = useState({
    zone_name: '',
    center_latitude: -37.8136,
    center_longitude: 144.9631,
    radius_km: 50,
    carcass_surcharge_pct: 0,
    doors_surcharge_pct: 0,
    active: true,
  });

  // Coordinate input component for radius assignment
  const CoordinateInput = ({ 
    latitude, 
    longitude, 
    radius, 
    onCoordinateChange, 
    onRadiusChange 
  }: {
    latitude: number;
    longitude: number;
    radius: number;
    onCoordinateChange: (lat: number, lng: number) => void;
    onRadiusChange: (radius: number) => void;
  }) => {
    const [geocodeAddress, setGeocodeAddress] = useState('');
    const [isGeocoding, setIsGeocoding] = useState(false);

    const handleGeocodeAddress = async () => {
      if (!geocodeAddress.trim()) return;

      setIsGeocoding(true);
      try {
        const { data, error } = await supabase.functions.invoke('geocode-postcode', {
          body: { postcode: geocodeAddress }
        });

        if (error) throw error;

        if (data.latitude && data.longitude) {
          onCoordinateChange(data.latitude, data.longitude);
          toast({
            title: "Address Geocoded",
            description: `Found coordinates: ${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`,
          });
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        toast({
          title: "Geocoding Error",
          description: "Failed to find coordinates for that address",
          variant: "destructive"
        });
      } finally {
        setIsGeocoding(false);
      }
    };

    return (
      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
        <div className="text-center">
          <MapPin className="w-8 h-8 mx-auto mb-2 text-primary" />
          <h4 className="font-medium">Zone Center Location</h4>
          <p className="text-sm text-muted-foreground">
            Enter coordinates manually or use geocoding to find them
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Enter address or postcode"
              value={geocodeAddress}
              onChange={(e) => setGeocodeAddress(e.target.value)}
              className="flex-1"
            />
            <Button 
              variant="outline"
              onClick={handleGeocodeAddress}
              disabled={isGeocoding || !geocodeAddress.trim()}
            >
              {isGeocoding ? (
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-1" />
              )}
              Find
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Latitude</Label>
              <Input
                type="number"
                step="0.000001"
                value={latitude}
                onChange={(e) => onCoordinateChange(parseFloat(e.target.value) || 0, longitude)}
                className="text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Longitude</Label>
              <Input
                type="number"
                step="0.000001"
                value={longitude}
                onChange={(e) => onCoordinateChange(latitude, parseFloat(e.target.value) || 0)}
                className="text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Radius (km)</Label>
              <Input
                type="number"
                min="1"
                max="500"
                value={radius}
                onChange={(e) => onRadiusChange(parseInt(e.target.value) || 50)}
                className="text-sm"
              />
            </div>
          </div>

          <div className="text-center p-3 bg-background rounded border-2 border-dashed">
            <Target className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
            <p className="text-sm font-medium">
              Zone Center: {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </p>
            <p className="text-xs text-muted-foreground">
              Radius: {radius}km coverage area
            </p>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [postcodesRes, zonesRes] = await Promise.all([
        supabase
          .from('postcode_zones')
          .select('*')
          .order('postcode'),
        supabase
          .from('assembly_surcharge_zones')
          .select('*')
          .eq('active', true)
          .order('zone_name')
      ]);

      if (postcodesRes.error) throw postcodesRes.error;
      if (zonesRes.error) throw zonesRes.error;

      setPostcodes(postcodesRes.data || []);
      setAssemblyZones(zonesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load assembly data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePostcodeAssembly = async (postcode: string, updates: Partial<PostcodeZone>) => {
    try {
      const { error } = await supabase
        .from('postcode_zones')
        .update({
          ...updates,
          assignment_method: 'manual' // Mark as manual override
        })
        .eq('postcode', postcode);

      if (error) throw error;

      // Refresh data
      loadData();
      toast({
        title: "Success",
        description: "Postcode assembly settings updated successfully.",
      });
    } catch (error) {
      console.error('Error updating postcode:', error);
      toast({
        title: "Error",
        description: "Failed to update postcode assembly settings.",
        variant: "destructive",
      });
    }
  };

  const createAssemblyZone = async () => {
    if (!newZoneData.zone_name || !newZoneData.center_latitude || !newZoneData.center_longitude) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingZone(true);
    try {
      // First create the zone for administrative purposes
      const { data: zone, error: zoneError } = await supabase
        .from('assembly_surcharge_zones')
        .insert([newZoneData])
        .select()
        .single();

      if (zoneError) throw zoneError;

      // Then apply the zone to postcodes within radius
      await applyZoneToRadius(
        zone.id,
        newZoneData.center_latitude,
        newZoneData.center_longitude,
        newZoneData.radius_km,
        newZoneData.carcass_surcharge_pct,
        newZoneData.doors_surcharge_pct
      );

      // Reset form and close dialog
      setNewZoneData({
        zone_name: '',
        center_latitude: 0,
        center_longitude: 0,
        radius_km: 50,
        carcass_surcharge_pct: 0,
        doors_surcharge_pct: 0,
        active: true,
      });
      setShowCreateZoneDialog(false);
      
      toast({
        title: "Success",
        description: "Radius assignment applied successfully.",
      });
      
      // Refresh data
      loadData();
    } catch (error) {
      console.error('Error applying radius assignment:', error);
      toast({
        title: "Error",
        description: "Failed to apply radius assignment.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingZone(false);
    }
  };

  const applyZoneToRadius = async (
    zoneId: string,
    latitude: number,
    longitude: number,
    radius: number,
    carcassSurchargePct: number,
    doorsSurchargePct: number
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('calculate-assembly-radius', {
        body: {
          center: {
            latitude,
            longitude,
            radius_km: radius
          },
          zone_id: zoneId,
          apply_changes: true,
          surcharge_settings: {
            carcass_surcharge_pct: carcassSurchargePct,
            doors_surcharge_pct: doorsSurchargePct
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Applied radius assignment to ${data.stats.within_radius} postcodes`,
      });

      loadData();
    } catch (error) {
      console.error('Error applying radius:', error);
      throw error;
    }
  };

  const filteredPostcodes = postcodes.filter(postcode => {
    if (filters.state && filters.state !== 'all' && postcode.state !== filters.state) return false;
    if (filters.postcode && !postcode.postcode.includes(filters.postcode)) return false;
    if (filters.assemblyEligible && filters.assemblyEligible !== 'all') {
      const eligible = filters.assemblyEligible === 'true';
      if (postcode.assembly_eligible !== eligible) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Unified Assembly Management</h2>
          <p className="text-muted-foreground">
            Manage assembly eligibility and surcharges using individual settings or radius tools
          </p>
        </div>
        <Button onClick={loadData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'postcodes')}>
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="postcodes">Unified Postcode Management</TabsTrigger>
        </TabsList>

        <TabsContent value="postcodes" className="space-y-6">
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-medium">Unified Postcode Management</h3>
            <p className="text-sm text-muted-foreground">
              Manage assembly eligibility and surcharges for postcodes. Use individual settings for specific postcodes or radius tools for bulk assignments.
            </p>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="stateFilter">State</Label>
                <Select value={filters.state} onValueChange={(value) => setFilters(prev => ({ ...prev, state: value === 'all' ? '' : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All states" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All states</SelectItem>
                    <SelectItem value="NSW">NSW</SelectItem>
                    <SelectItem value="VIC">VIC</SelectItem>
                    <SelectItem value="QLD">QLD</SelectItem>
                    <SelectItem value="WA">WA</SelectItem>
                    <SelectItem value="SA">SA</SelectItem>
                    <SelectItem value="TAS">TAS</SelectItem>
                    <SelectItem value="ACT">ACT</SelectItem>
                    <SelectItem value="NT">NT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="postcodeFilter">Postcode</Label>
                <Input
                  id="postcodeFilter"
                  placeholder="Search postcode..."
                  value={filters.postcode}
                  onChange={(e) => setFilters(prev => ({ ...prev, postcode: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="assemblyFilter">Assembly Status</Label>
                <Select value={filters.assemblyEligible} onValueChange={(value) => setFilters(prev => ({ ...prev, assemblyEligible: value === 'all' ? '' : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="true">Assembly Available</SelectItem>
                    <SelectItem value="false">No Assembly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  onClick={() => setFilters({ state: 'all', postcode: '', assemblyEligible: 'all' })}
                  variant="outline"
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Radius Assignment Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Radius Assignment Tools
                </CardTitle>
                <CardDescription>
                  Bulk assign assembly settings to postcodes within a geographic radius
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={showCreateZoneDialog} onOpenChange={setShowCreateZoneDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Radius Assignment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Radius Assignment</DialogTitle>
                      <DialogDescription>
                        Define a geographic radius to bulk assign assembly settings to postcodes within the area
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="zoneName">Zone Name</Label>
                        <Input
                          id="zoneName"
                          placeholder="e.g., Melbourne Metro"
                          value={newZoneData.zone_name}
                          onChange={(e) => setNewZoneData(prev => ({ ...prev, zone_name: e.target.value }))}
                        />
                      </div>
                      
                      <CoordinateInput
                        latitude={newZoneData.center_latitude}
                        longitude={newZoneData.center_longitude}
                        radius={newZoneData.radius_km}
                        onCoordinateChange={(lat, lng) => 
                          setNewZoneData(prev => ({ ...prev, center_latitude: lat, center_longitude: lng }))
                        }
                        onRadiusChange={(radius) => 
                          setNewZoneData(prev => ({ ...prev, radius_km: radius }))
                        }
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="carcassSurcharge">Carcass Surcharge %</Label>
                          <Input
                            id="carcassSurcharge"
                            type="number"
                            min="0"
                            max="100"
                            value={newZoneData.carcass_surcharge_pct}
                            onChange={(e) => setNewZoneData(prev => ({ ...prev, carcass_surcharge_pct: parseInt(e.target.value) || 0 }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="doorsSurcharge">Doors Surcharge %</Label>
                          <Input
                            id="doorsSurcharge"
                            type="number"
                            min="0"
                            max="100"
                            value={newZoneData.doors_surcharge_pct}
                            onChange={(e) => setNewZoneData(prev => ({ ...prev, doors_surcharge_pct: parseInt(e.target.value) || 0 }))}
                          />
                        </div>
                      </div>
                      
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <strong>Note:</strong> This will update all postcodes within the radius that don't have manual overrides. 
                          Postcodes with manual settings will remain unchanged.
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCreateZoneDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createAssemblyZone} disabled={isCreatingZone}>
                        {isCreatingZone ? "Applying..." : "Apply to Radius"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Postcodes Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Postcode</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Zone</TableHead>
                      <TableHead>Assembly Available</TableHead>
                      <TableHead>Carcass Surcharge</TableHead>
                      <TableHead>Doors Surcharge</TableHead>
                      <TableHead>Assignment</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPostcodes.map((postcode) => (
                      <TableRow key={postcode.id}>
                        <TableCell>{postcode.postcode}</TableCell>
                        <TableCell>{postcode.state}</TableCell>
                        <TableCell>{postcode.zone}</TableCell>
                        <TableCell>
                          <Badge variant={postcode.assembly_eligible ? "default" : "secondary"}>
                            {postcode.assembly_eligible ? "Available" : "Not Available"}
                          </Badge>
                        </TableCell>
                        <TableCell>{postcode.assembly_carcass_surcharge_pct}%</TableCell>
                        <TableCell>{postcode.assembly_doors_surcharge_pct}%</TableCell>
                        <TableCell>
                          <Badge variant={
                            postcode.assignment_method === 'manual' ? "default" : 
                            postcode.assignment_method === 'radius' ? "secondary" : "outline"
                          }>
                            {postcode.assignment_method === 'manual' ? "Manual" : 
                             postcode.assignment_method === 'radius' ? "Radius" : "Default"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingPostcode(postcode);
                                setShowEditDialog(true);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                updatePostcodeAssembly(postcode.postcode, {
                                  assembly_eligible: !postcode.assembly_eligible
                                });
                              }}
                            >
                              {postcode.assembly_eligible ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Postcode Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Postcode Assembly Settings</DialogTitle>
            <DialogDescription>
              Update assembly eligibility and surcharges for {editingPostcode?.postcode}
            </DialogDescription>
          </DialogHeader>
          {editingPostcode && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingPostcode.assembly_eligible}
                  onCheckedChange={(checked) => 
                    setEditingPostcode(prev => prev ? { ...prev, assembly_eligible: checked } : null)
                  }
                />
                <Label>Assembly Available</Label>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Carcass Surcharge %</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={editingPostcode.assembly_carcass_surcharge_pct}
                    onChange={(e) => 
                      setEditingPostcode(prev => prev ? { 
                        ...prev, 
                        assembly_carcass_surcharge_pct: parseInt(e.target.value) || 0 
                      } : null)
                    }
                  />
                </div>
                <div>
                  <Label>Doors Surcharge %</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={editingPostcode.assembly_doors_surcharge_pct}
                    onChange={(e) => 
                      setEditingPostcode(prev => prev ? { 
                        ...prev, 
                        assembly_doors_surcharge_pct: parseInt(e.target.value) || 0 
                      } : null)
                    }
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (editingPostcode) {
                updatePostcodeAssembly(editingPostcode.postcode, {
                  assembly_eligible: editingPostcode.assembly_eligible,
                  assembly_carcass_surcharge_pct: editingPostcode.assembly_carcass_surcharge_pct,
                  assembly_doors_surcharge_pct: editingPostcode.assembly_doors_surcharge_pct
                });
                setShowEditDialog(false);
              }
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnifiedAssemblyManager;