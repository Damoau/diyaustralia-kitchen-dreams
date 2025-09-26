import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
  MapPin, 
  Compass, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Settings,
  Save,
  User,
  Target,
  Search,
  Filter
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PostcodeZone {
  id: string;
  postcode: string;
  suburb?: string;
  state: string;
  assembly_eligible: boolean;
  assembly_carcass_surcharge_pct: number;
  assembly_doors_surcharge_pct: number;
  assignment_method: 'manual' | 'radius' | string;
  assigned_zone_id?: string;
  last_assignment_date?: string;
  assembly_surcharge_zones?: {
    zone_name: string;
    radius_km: number;
  };
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
  const [filteredPostcodes, setFilteredPostcodes] = useState<PostcodeZone[]>([]);
  const [assemblyZones, setAssemblyZones] = useState<AssemblyZone[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [assignmentFilter, setAssemblyMethodFilter] = useState('all');
  const [eligibilityFilter, setEligibilityFilter] = useState('all');

  // New zone form
  const [isCreatingZone, setIsCreatingZone] = useState(false);
  
  // Edit postcode dialog
  const [isEditingPostcode, setIsEditingPostcode] = useState(false);
  const [editingPostcode, setEditingPostcode] = useState<PostcodeZone | null>(null);
  const [newZone, setNewZone] = useState({
    zone_name: '',
    center_latitude: -37.8136,
    center_longitude: 144.9631,
    radius_km: 50,
    carcass_surcharge_pct: 15,
    doors_surcharge_pct: 20
  });

  // Map component for zone creation
  const MapComponent = ({ latitude, longitude, radius, onLocationChange }: {
    latitude: number;
    longitude: number;
    radius: number;
    onLocationChange: (lat: number, lng: number) => void;
  }) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const marker = useRef<mapboxgl.Marker | null>(null);
    const circle = useRef<any>(null);
    const [mapboxToken, setMapboxToken] = useState('');

    useEffect(() => {
      const loadMapboxToken = async () => {
        try {
          // Check if Mapbox service is available via geocoding function
          const response = await supabase.functions.invoke('geocode-postcode', {
            body: { postcode: '3000' } // Test postcode
          });
          
          if (response.error) {
            console.error('Mapbox service not available:', response.error);
            setMapboxToken('unavailable');
          } else {
            setMapboxToken('available');
          }
        } catch (error) {
          console.error('Mapbox service not available:', error);
          setMapboxToken('unavailable');
        }
      };

      loadMapboxToken();
    }, []);

    useEffect(() => {
      if (!mapContainer.current || mapboxToken !== 'available') return;

      // Use a placeholder token since the real token is in Edge Functions
      mapboxgl.accessToken = 'pk.placeholder';
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [longitude, latitude],
        zoom: 8
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Create draggable marker
      marker.current = new mapboxgl.Marker({ draggable: true })
        .setLngLat([longitude, latitude])
        .addTo(map.current);

      // Handle marker drag
      marker.current.on('dragend', () => {
        const lngLat = marker.current!.getLngLat();
        onLocationChange(lngLat.lat, lngLat.lng);
        updateCircle(lngLat.lat, lngLat.lng, radius);
      });

      // Add radius circle
      map.current.on('load', () => {
        updateCircle(latitude, longitude, radius);
      });

      return () => {
        map.current?.remove();
      };
    }, []);

    useEffect(() => {
      if (marker.current) {
        marker.current.setLngLat([longitude, latitude]);
        updateCircle(latitude, longitude, radius);
      }
    }, [latitude, longitude, radius]);

    const updateCircle = (lat: number, lng: number, radiusKm: number) => {
      if (!map.current) return;

      // Remove existing circle
      if (circle.current) {
        try {
          map.current.removeLayer('radius-circle');
          map.current.removeLayer('radius-circle-stroke');
          map.current.removeSource('radius-circle');
        } catch (e) {
          // Layer might not exist yet
        }
      }

      // Create a simple circle approximation
      const points: number[][] = [];
      const center = [lng, lat];
      const steps = 64;
      
      for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * 2 * Math.PI;
        const dx = (radiusKm / 111.32) * Math.cos(angle); // rough conversion to degrees
        const dy = (radiusKm / 110.54) * Math.sin(angle);
        points.push([center[0] + dx, center[1] + dy]);
      }
      points.push(points[0]); // close the polygon

      const circleGeoJSON = {
        "type": "Feature" as const,
        "properties": {},
        "geometry": {
          "type": "Polygon" as const,
          "coordinates": [points]
        }
      };

      map.current.addSource('radius-circle', {
        type: 'geojson',
        data: circleGeoJSON as any
      });

      map.current.addLayer({
        id: 'radius-circle',
        type: 'fill',
        source: 'radius-circle',
        paint: {
          'fill-color': '#007cbf',
          'fill-opacity': 0.2
        }
      });

      map.current.addLayer({
        id: 'radius-circle-stroke',
        type: 'line',
        source: 'radius-circle',
        paint: {
          'line-color': '#007cbf',
          'line-width': 2
        }
      });

      circle.current = true;
    };

    if (mapboxToken === 'unavailable') {
      return (
        <div className="w-full h-64 rounded-lg border-2 border-dashed border-muted-foreground/50 flex items-center justify-center">
          <div className="text-center p-4">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Mapbox service not available
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Please configure MAPBOX_PUBLIC_TOKEN in Edge Function Secrets
            </p>
          </div>
        </div>
      );
    }

    if (mapboxToken !== 'available') {
      return (
        <div className="w-full h-64 rounded-lg border border-muted flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Checking map service availability...</p>
          </div>
        </div>
      );
    }

    return <div ref={mapContainer} className="w-full h-64 rounded-lg" />;
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterPostcodes();
  }, [postcodes, searchTerm, stateFilter, assignmentFilter, eligibilityFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [postcodesRes, zonesRes] = await Promise.all([
        supabase
          .from('postcode_zones')
          .select(`
            *,
            assembly_surcharge_zones (
              zone_name,
              radius_km
            )
          `)
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

  const filterPostcodes = () => {
    let filtered = postcodes;

    if (searchTerm) {
      filtered = filtered.filter(pc => 
        pc.postcode.includes(searchTerm) || 
        pc.suburb?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (stateFilter !== 'all') {
      filtered = filtered.filter(pc => pc.state === stateFilter);
    }

    if (assignmentFilter !== 'all') {
      filtered = filtered.filter(pc => pc.assignment_method === assignmentFilter);
    }

    if (eligibilityFilter !== 'all') {
      const isEligible = eligibilityFilter === 'eligible';
      filtered = filtered.filter(pc => pc.assembly_eligible === isEligible);
    }

    setFilteredPostcodes(filtered);
  };

  const updatePostcodeAssembly = async (postcodeId: string, updates: Partial<PostcodeZone>) => {
    try {
      const { error } = await supabase
        .from('postcode_zones')
        .update({
          ...updates,
          assignment_method: 'manual',
          assigned_zone_id: null,
          last_assignment_date: new Date().toISOString()
        })
        .eq('id', postcodeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Postcode assembly settings updated",
      });

      loadData();
    } catch (error) {
      console.error('Error updating postcode:', error);
      toast({
        title: "Error",
        description: "Failed to update postcode settings",
        variant: "destructive"
      });
    }
  };

  const applyZoneToRadius = async (zoneId: string) => {
    const zone = assemblyZones.find(z => z.id === zoneId);
    if (!zone) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('calculate-assembly-radius', {
        body: { 
          center: {
            latitude: zone.center_latitude,
            longitude: zone.center_longitude,
            radius_km: zone.radius_km
          },
          apply_changes: true,
          surcharge_settings: {
            carcass_surcharge_pct: zone.carcass_surcharge_pct,
            doors_surcharge_pct: zone.doors_surcharge_pct
          }
        }
      });

      if (error) throw error;

      // Update assignment tracking for affected postcodes
      const affectedPostcodes = data.results.filter((pc: any) => pc.within_radius);
      
      for (const pc of affectedPostcodes) {
        await supabase
          .from('postcode_zones')
          .update({
            assignment_method: 'radius',
            assigned_zone_id: zoneId,
            last_assignment_date: new Date().toISOString()
          })
          .eq('postcode', pc.postcode);
      }

      // Update zone's affected postcodes count
      await supabase
        .from('assembly_surcharge_zones')
        .update({ affected_postcodes_count: affectedPostcodes.length })
        .eq('id', zoneId);

      toast({
        title: "Success",
        description: `Applied ${zone.zone_name} to ${affectedPostcodes.length} postcodes within ${zone.radius_km}km radius`,
      });

      loadData();
    } catch (error) {
      console.error('Error applying zone:', error);
      toast({
        title: "Error",
        description: "Failed to apply zone to radius",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createAssemblyZone = async () => {
    // Validate required fields
    if (!newZone.zone_name.trim()) {
      toast({
        title: "Error",
        description: "Zone name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('assembly_surcharge_zones')
        .insert([newZone]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assembly zone created successfully",
      });

      setIsCreatingZone(false);
      setNewZone({
        zone_name: '',
        center_latitude: -37.8136,
        center_longitude: 144.9631,
        radius_km: 50,
        carcass_surcharge_pct: 15,
        doors_surcharge_pct: 20
      });
      loadData();
    } catch (error) {
      console.error('Error creating zone:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create assembly zone",
        variant: "destructive"
      });
    }
  };

  const getAssignmentBadge = (postcode: PostcodeZone) => {
    if (postcode.assignment_method === 'manual') {
      return <Badge variant="outline"><User className="w-3 h-3 mr-1" />Manual</Badge>;
    } else {
      return <Badge variant="secondary"><Target className="w-3 h-3 mr-1" />Radius</Badge>;
    }
  };

  const uniqueStates = [...new Set(postcodes.map(pc => pc.state))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Unified Assembly Management</h2>
          <p className="text-muted-foreground">Manage assembly eligibility and surcharges for all postcodes in one place</p>
        </div>
        <Button onClick={() => setIsCreatingZone(true)}>
          <MapPin className="w-4 h-4 mr-2" />
          Create Assembly Zone
        </Button>
      </div>

      <Tabs defaultValue="postcodes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="postcodes">Postcode Management</TabsTrigger>
          <TabsTrigger value="zones">Assembly Zones</TabsTrigger>
        </TabsList>

        <TabsContent value="postcodes" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Postcode or suburb"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Select value={stateFilter} onValueChange={setStateFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All States</SelectItem>
                      {uniqueStates.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Assignment Method</Label>
                  <Select value={assignmentFilter} onValueChange={setAssemblyMethodFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="radius">Radius</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Assembly Status</Label>
                  <Select value={eligibilityFilter} onValueChange={setEligibilityFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="eligible">Eligible</SelectItem>
                      <SelectItem value="not-eligible">Not Eligible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={loadData} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Postcodes List */}
          <Card>
            <CardHeader>
              <CardTitle>Postcodes ({filteredPostcodes.length})</CardTitle>
              <CardDescription>
                Each postcode has a single record with assembly settings. Manual changes override radius assignments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading postcodes...</div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredPostcodes.map((postcode) => (
                    <div key={postcode.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{postcode.postcode}</span>
                            <Badge variant="outline" className="text-xs">{postcode.state}</Badge>
                            {getAssignmentBadge(postcode)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {postcode.suburb || 'Unknown suburb'}
                          </div>
                        </div>
                        
                        {/* Radius Zone Information */}
                        <div className="flex-1 max-w-xs">
                          {postcode.assembly_surcharge_zones ? (
                            <div className="text-sm">
                              <div className="flex items-center gap-1 text-primary">
                                <Compass className="w-3 h-3" />
                                <span className="font-medium">{postcode.assembly_surcharge_zones.zone_name}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {postcode.assembly_surcharge_zones.radius_km}km radius zone
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span>No radius zone</span>
                              </div>
                              <div className="text-xs">Manual assignment only</div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-sm">
                          {postcode.assembly_eligible ? (
                            <div className="text-green-600">
                              <div>✓ Assembly Available</div>
                              <div className="text-xs">
                                +{postcode.assembly_carcass_surcharge_pct}% carcass, +{postcode.assembly_doors_surcharge_pct}% doors
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-500">✗ No Assembly</div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={postcode.assembly_eligible}
                            onCheckedChange={(checked) => 
                              updatePostcodeAssembly(postcode.id, {
                                assembly_eligible: checked,
                                assembly_carcass_surcharge_pct: checked ? 15 : 0,
                                assembly_doors_surcharge_pct: checked ? 20 : 0
                              })
                            }
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingPostcode(postcode);
                              setIsEditingPostcode(true);
                            }}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zones" className="space-y-4">
          {/* Assembly Zones */}
          <div className="grid gap-4">
            {assemblyZones.map((zone) => (
              <Card key={zone.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Compass className="w-5 h-5" />
                        {zone.zone_name}
                      </CardTitle>
                      <CardDescription>
                        {zone.radius_km}km radius • {zone.affected_postcodes_count || 0} postcodes affected
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={() => applyZoneToRadius(zone.id)}
                      disabled={loading}
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Apply to Radius
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Center</p>
                      <p className="font-medium">{zone.center_latitude.toFixed(4)}, {zone.center_longitude.toFixed(4)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Radius</p>
                      <p className="font-medium">{zone.radius_km} km</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Carcass Surcharge</p>
                      <p className="font-medium">+{zone.carcass_surcharge_pct}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Doors Surcharge</p>
                      <p className="font-medium">+{zone.doors_surcharge_pct}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Postcode Dialog */}
      <Dialog open={isEditingPostcode} onOpenChange={setIsEditingPostcode}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Postcode Assembly Settings</DialogTitle>
            <DialogDescription>
              Configure assembly settings for {editingPostcode?.postcode} - {editingPostcode?.suburb}
            </DialogDescription>
          </DialogHeader>
          {editingPostcode && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Assembly Eligible</Label>
                  <Switch
                    checked={editingPostcode.assembly_eligible}
                    onCheckedChange={(checked) => 
                      setEditingPostcode({
                        ...editingPostcode,
                        assembly_eligible: checked
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Carcass Surcharge (%)</Label>
                  <Input
                    type="number"
                    value={editingPostcode.assembly_carcass_surcharge_pct}
                    onChange={(e) => setEditingPostcode({
                      ...editingPostcode,
                      assembly_carcass_surcharge_pct: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Doors Surcharge (%)</Label>
                  <Input
                    type="number"
                    value={editingPostcode.assembly_doors_surcharge_pct}
                    onChange={(e) => setEditingPostcode({
                      ...editingPostcode,
                      assembly_doors_surcharge_pct: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={async () => {
                    try {
                      await updatePostcodeAssembly(editingPostcode.id, {
                        assembly_eligible: editingPostcode.assembly_eligible,
                        assembly_carcass_surcharge_pct: editingPostcode.assembly_carcass_surcharge_pct,
                        assembly_doors_surcharge_pct: editingPostcode.assembly_doors_surcharge_pct
                      });
                      
                      // Update local state immediately
                      setPostcodes(prev => prev.map(pc => 
                        pc.id === editingPostcode.id 
                          ? { 
                              ...pc, 
                              assembly_eligible: editingPostcode.assembly_eligible,
                              assembly_carcass_surcharge_pct: editingPostcode.assembly_carcass_surcharge_pct,
                              assembly_doors_surcharge_pct: editingPostcode.assembly_doors_surcharge_pct,
                              assignment_method: 'manual'
                            }
                          : pc
                      ));
                      
                      setIsEditingPostcode(false);
                      setEditingPostcode(null);
                    } catch (error) {
                      // Error handling is already in updatePostcodeAssembly
                      console.error('Save failed:', error);
                    }
                  }}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditingPostcode(false);
                    setEditingPostcode(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Zone Dialog */}
      <Dialog open={isCreatingZone} onOpenChange={setIsCreatingZone}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Assembly Zone</DialogTitle>
            <DialogDescription>Define a geographic zone with assembly surcharges</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Zone Name <span className="text-red-500">*</span></Label>
                <Input
                  value={newZone.zone_name}
                  onChange={(e) => setNewZone({...newZone, zone_name: e.target.value})}
                  placeholder="Melbourne Assembly Zone"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Radius (km)</Label>
                <Input
                  type="number"
                  value={newZone.radius_km}
                  onChange={(e) => setNewZone({...newZone, radius_km: parseInt(e.target.value) || 50})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Set Center Location</Label>
              <div className="text-sm text-muted-foreground mb-2">
                Drag the pin to set the center of your assembly zone. The radius will be shown as a circle.
              </div>
              <MapComponent
                latitude={newZone.center_latitude}
                longitude={newZone.center_longitude}
                radius={newZone.radius_km}
                onLocationChange={(lat, lng) => setNewZone({...newZone, center_latitude: lat, center_longitude: lng})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Carcass Surcharge (%)</Label>
                <Input
                  type="number"
                  value={newZone.carcass_surcharge_pct}
                  onChange={(e) => setNewZone({...newZone, carcass_surcharge_pct: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label>Doors Surcharge (%)</Label>
                <Input
                  type="number"
                  value={newZone.doors_surcharge_pct}
                  onChange={(e) => setNewZone({...newZone, doors_surcharge_pct: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>

            <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
              <div className="font-medium mb-1">Current coordinates:</div>
              <div>Latitude: {newZone.center_latitude.toFixed(4)}</div>
              <div>Longitude: {newZone.center_longitude.toFixed(4)}</div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={createAssemblyZone}
                disabled={!newZone.zone_name.trim()}
              >
                <Save className="w-4 h-4 mr-2" />
                Create Zone
              </Button>
              <Button variant="outline" onClick={() => setIsCreatingZone(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnifiedAssemblyManager;