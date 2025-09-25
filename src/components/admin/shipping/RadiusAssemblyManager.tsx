import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  MapPin, 
  Compass, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Settings,
  Save
} from 'lucide-react';

interface AssemblyCenter {
  id?: string;
  name: string;
  address: string;
  postcode: string;
  latitude: number;
  longitude: number;
  radius_km: number;
  active: boolean;
}

interface PostcodeData {
  postcode: string;
  suburb: string;
  state: string;
  latitude: number;
  longitude: number;
  distance_km?: number;
  within_radius?: boolean;
}

const RadiusAssemblyManager = () => {
  const { toast } = useToast();
  const [assemblyCenters, setAssemblyCenters] = useState<AssemblyCenter[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<AssemblyCenter | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mapboxToken, setMapboxToken] = useState('');
  const [affectedPostcodes, setAffectedPostcodes] = useState<PostcodeData[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    postcode: '',
    radius_km: 50,
    active: true
  });

  const [geoData, setGeoData] = useState({
    latitude: 0,
    longitude: 0
  });

  useEffect(() => {
    loadAssemblyCenters();
    loadMapboxToken();
  }, []);

  const loadMapboxToken = async () => {
    try {
      // Check if we have access to the geocoding function instead of storing token
      const { data, error } = await supabase.functions.invoke('geocode-postcode', {
        body: { postcode: '3000' } // Test call
      });
      if (!error) {
        setMapboxToken('available'); // Indicate service is available
      }
    } catch (error) {
      console.log('Geocoding service not available');
    }
  };

  const loadAssemblyCenters = async () => {
    try {
      // For now, we'll use a local state. In production, this would load from database
      setAssemblyCenters([
        {
          id: '1',
          name: 'Melbourne Assembly Center',
          address: '123 Collins Street, Melbourne VIC',
          postcode: '3000',
          latitude: -37.8136,
          longitude: 144.9631,
          radius_km: 75,
          active: true
        }
      ]);
    } catch (error) {
      console.error('Error loading assembly centers:', error);
    }
  };

  const geocodeAddress = async (address: string, postcode: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('geocode-postcode', {
        body: { address, postcode }
      });

      if (error) throw error;
      if (!data) throw new Error('No geocoding data received');

      return {
        latitude: data.latitude,
        longitude: data.longitude
      };
    } catch (error) {
      throw new Error('Geocoding failed: ' + (error.message || 'Unknown error'));
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const findPostcodesInRadius = async (center: AssemblyCenter) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('calculate-assembly-radius', {
        body: { 
          center: {
            latitude: center.latitude,
            longitude: center.longitude,
            radius_km: center.radius_km
          },
          apply_changes: false // Just calculate, don't apply yet
        }
      });

      if (error) throw error;

      const postcodesWithDistance = data.results.map((pc: any) => ({
        postcode: pc.postcode,
        suburb: pc.suburb || 'Unknown',
        state: pc.state,
        latitude: pc.latitude,
        longitude: pc.longitude,
        distance_km: pc.distance_km,
        within_radius: pc.within_radius
      }));

      setAffectedPostcodes(postcodesWithDistance);
    } catch (error) {
      console.error('Error finding postcodes in radius:', error);
      toast({
        title: "Error",
        description: "Failed to calculate postcodes in radius",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Mock coordinates for common postcodes (in production, these would be geocoded)
  const getMockCoordinates = (postcode: string) => {
    const coords: { [key: string]: { latitude: number; longitude: number } } = {
      '3000': { latitude: -37.8136, longitude: 144.9631 }, // Melbourne CBD
      '3001': { latitude: -37.8081, longitude: 144.9633 }, // Melbourne
      '3002': { latitude: -37.8197, longitude: 144.9742 }, // East Melbourne
      '3141': { latitude: -37.8467, longitude: 144.9936 }, // South Yarra
      '4000': { latitude: -27.4698, longitude: 153.0251 }, // Brisbane CBD
      '2000': { latitude: -33.8688, longitude: 151.2093 }, // Sydney CBD
    };
    
    return coords[postcode] || { latitude: -37.8136, longitude: 144.9631 };
  };

  const handleGeocodeAddress = async () => {
    if (!formData.address || !formData.postcode) {
      toast({
        title: "Error",
        description: "Please enter both address and postcode",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const coordinates = await geocodeAddress(formData.address, formData.postcode);
      setGeoData(coordinates);
      toast({
        title: "Success",
        description: "Address geocoded successfully",
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to geocode address",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCenter = async () => {
    try {
      setLoading(true);
      
      const newCenter: AssemblyCenter = {
        id: selectedCenter?.id || Date.now().toString(),
        name: formData.name,
        address: formData.address,
        postcode: formData.postcode,
        latitude: geoData.latitude,
        longitude: geoData.longitude,
        radius_km: formData.radius_km,
        active: formData.active
      };

      // In production, save to database
      if (selectedCenter?.id) {
        setAssemblyCenters(prev => prev.map(c => c.id === selectedCenter.id ? newCenter : c));
      } else {
        setAssemblyCenters(prev => [...prev, newCenter]);
      }

      toast({
        title: "Success",
        description: `Assembly center ${selectedCenter ? 'updated' : 'created'} successfully`,
      });

      setIsEditing(false);
      setSelectedCenter(null);
      
      // Calculate affected postcodes
      await findPostcodesInRadius(newCenter);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save assembly center",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditCenter = (center: AssemblyCenter) => {
    setSelectedCenter(center);
    setFormData({
      name: center.name,
      address: center.address,
      postcode: center.postcode,
      radius_km: center.radius_km,
      active: center.active
    });
    setGeoData({
      latitude: center.latitude,
      longitude: center.longitude
    });
    setIsEditing(true);
  };

  const applyAssemblyRadius = async () => {
    if (!selectedCenter) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('calculate-assembly-radius', {
        body: { 
          center: {
            latitude: selectedCenter.latitude,
            longitude: selectedCenter.longitude,
            radius_km: selectedCenter.radius_km
          },
          apply_changes: true // Apply the changes to database
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Updated assembly eligibility for postcodes within ${selectedCenter.radius_km}km radius. ${data.stats.within_radius} postcodes now assembly eligible.`,
      });

      // Refresh the postcode analysis
      await findPostcodesInRadius(selectedCenter);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply assembly radius changes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Radius-Based Assembly Management</h2>
          <p className="text-muted-foreground">Set assembly coverage areas using geographic radius</p>
        </div>
        <Button onClick={() => setIsEditing(true)}>
          <MapPin className="w-4 h-4 mr-2" />
          Add Assembly Center
        </Button>
      </div>

      {!mapboxToken && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Geocoding service not available. Please ensure MAPBOX_PUBLIC_TOKEN is configured in Supabase Edge Function Secrets.
            <p className="text-xs text-muted-foreground mt-1">
              Get your token from <a href="https://mapbox.com" className="underline" target="_blank" rel="noopener noreferrer">mapbox.com</a> and add it to Supabase Project Settings → Edge Functions → Secrets
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Assembly Centers List */}
      <div className="grid gap-4">
        {assemblyCenters.map((center) => (
          <Card key={center.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Compass className="w-5 h-5" />
                    {center.name}
                    {center.active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{center.address}</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => findPostcodesInRadius(center)}
                    disabled={loading}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Calculate Coverage
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditCenter(center)}
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Postcode</p>
                  <p className="font-medium">{center.postcode}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Radius</p>
                  <p className="font-medium">{center.radius_km} km</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Coordinates</p>
                  <p className="font-medium">{center.latitude.toFixed(4)}, {center.longitude.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Coverage</p>
                  <p className="font-medium">
                    {affectedPostcodes.filter(pc => pc.within_radius).length} postcodes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit/Add Center Form */}
      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedCenter ? 'Edit Assembly Center' : 'Add Assembly Center'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Center Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Melbourne Assembly Center"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postcode">Postcode</Label>
                <Input
                  id="postcode"
                  value={formData.postcode}
                  onChange={(e) => setFormData({...formData, postcode: e.target.value})}
                  placeholder="3000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <div className="flex space-x-2">
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="123 Collins Street, Melbourne VIC"
                  className="flex-1"
                />
                <Button 
                  variant="outline"
                  onClick={handleGeocodeAddress}
                  disabled={loading || mapboxToken !== 'available'}
                >
                  <MapPin className="w-4 h-4 mr-1" />
                  Geocode
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="radius">Assembly Radius (km)</Label>
                <Input
                  id="radius"
                  type="number"
                  min="1"
                  max="500"
                  value={formData.radius_km}
                  onChange={(e) => setFormData({...formData, radius_km: parseInt(e.target.value) || 50})}
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({...formData, active: checked})}
                />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>

            {geoData.latitude !== 0 && geoData.longitude !== 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Coordinates: {geoData.latitude.toFixed(4)}, {geoData.longitude.toFixed(4)}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveCenter}
                disabled={loading || !formData.name || !formData.address}
              >
                <Save className="w-4 h-4 mr-1" />
                Save Center
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Affected Postcodes */}
      {affectedPostcodes.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Postcode Coverage Analysis</CardTitle>
                <CardDescription>
                  Postcodes within {selectedCenter?.radius_km || 0}km radius of assembly center
                </CardDescription>
              </div>
              <Button onClick={applyAssemblyRadius} disabled={loading}>
                <CheckCircle className="w-4 h-4 mr-1" />
                Apply Changes
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {affectedPostcodes.filter(pc => pc.within_radius).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Within Radius</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {affectedPostcodes.filter(pc => !pc.within_radius).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Outside Radius</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {Math.round(affectedPostcodes.filter(pc => pc.within_radius).length / affectedPostcodes.length * 100)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Coverage</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {Math.min(...affectedPostcodes.map(pc => pc.distance_km)).toFixed(1)}km
                  </p>
                  <p className="text-sm text-muted-foreground">Nearest</p>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {affectedPostcodes.slice(0, 50).map((pc) => (
                    <div 
                      key={pc.postcode}
                      className={`p-2 rounded border text-xs ${
                        pc.within_radius 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{pc.postcode}</span>
                        <span className={pc.within_radius ? 'text-green-600' : 'text-gray-600'}>
                          {pc.distance_km}km
                        </span>
                      </div>
                      <div className="text-muted-foreground">
                        {pc.suburb}, {pc.state}
                      </div>
                    </div>
                  ))}
                </div>
                {affectedPostcodes.length > 50 && (
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    Showing first 50 of {affectedPostcodes.length} postcodes
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RadiusAssemblyManager;