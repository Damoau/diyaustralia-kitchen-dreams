import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useShipping } from '@/hooks/useShipping';
import { MapPin, Plus, Upload, Download, Edit } from 'lucide-react';

interface PostcodeZone {
  id: string;
  state: string;
  postcode: string;
  zone: string;
  assembly_eligible: boolean;
  delivery_eligible: boolean;
  lead_time_days: number;
  metro: boolean;
  remote: boolean;
}

const ZoneManagement = () => {
  const { toast } = useToast();
  const { getPostcodeZones, updatePostcodeZone, loading } = useShipping();
  
  const [zones, setZones] = useState<PostcodeZone[]>([]);
  const [filteredZones, setFilteredZones] = useState<PostcodeZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<PostcodeZone | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const [filters, setFilters] = useState({
    state: '',
    zone: '',
    postcode: '',
    assemblyEligible: null as boolean | null,
    metro: null as boolean | null
  });

  const [editData, setEditData] = useState({
    assembly_eligible: false,
    delivery_eligible: true,
    lead_time_days: 5,
    metro: false,
    remote: false
  });

  const states = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'];
  const zoneTypes = ['MELB', 'SYDN', 'BRIS', 'ADEL', 'PERTH', 'HOB', 'DARW', 'CANB', 'REG1', 'REG2', 'REG3'];

  useEffect(() => {
    loadZones();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [zones, filters]);

  const loadZones = async () => {
    try {
      const data = await getPostcodeZones();
      setZones(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load postcode zones",
        variant: "destructive",
      });
    }
  };

  const applyFilters = () => {
    let filtered = zones;

    if (filters.state) {
      filtered = filtered.filter(zone => zone.state === filters.state);
    }

    if (filters.zone) {
      filtered = filtered.filter(zone => zone.zone === filters.zone);
    }

    if (filters.postcode) {
      filtered = filtered.filter(zone => 
        zone.postcode.toLowerCase().includes(filters.postcode.toLowerCase())
      );
    }

    if (filters.assemblyEligible !== null) {
      filtered = filtered.filter(zone => zone.assembly_eligible === filters.assemblyEligible);
    }

    if (filters.metro !== null) {
      filtered = filtered.filter(zone => zone.metro === filters.metro);
    }

    setFilteredZones(filtered);
  };

  const handleEditZone = (zone: PostcodeZone) => {
    setSelectedZone(zone);
    setEditData({
      assembly_eligible: zone.assembly_eligible,
      delivery_eligible: zone.delivery_eligible,
      lead_time_days: zone.lead_time_days,
      metro: zone.metro,
      remote: zone.remote
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateZone = async () => {
    if (!selectedZone) return;

    try {
      await updatePostcodeZone(selectedZone.id, editData);
      toast({
        title: "Success",
        description: "Postcode zone updated successfully",
      });
      setIsEditDialogOpen(false);
      loadZones();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update postcode zone",
        variant: "destructive",
      });
    }
  };

  const getZoneStats = () => {
    const totalZones = zones.length;
    const assemblyEligible = zones.filter(z => z.assembly_eligible).length;
    const metroZones = zones.filter(z => z.metro).length;
    const remoteZones = zones.filter(z => z.remote).length;

    return {
      totalZones,
      assemblyEligible,
      metroZones,
      remoteZones,
      avgLeadTime: zones.length > 0 
        ? (zones.reduce((sum, z) => sum + z.lead_time_days, 0) / zones.length).toFixed(1)
        : 0
    };
  };

  const stats = getZoneStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Zone & Postcode Management</h2>
          <p className="text-muted-foreground">Manage delivery zones and postcode mappings</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Zones</p>
                <p className="text-2xl font-bold">{stats.totalZones}</p>
              </div>
              <MapPin className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Assembly Eligible</p>
                <p className="text-2xl font-bold">{stats.assemblyEligible}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Metro Areas</p>
                <p className="text-2xl font-bold">{stats.metroZones}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Remote Areas</p>
                <p className="text-2xl font-bold">{stats.remoteZones}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Lead Time</p>
                <p className="text-2xl font-bold">{stats.avgLeadTime}d</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Select value={filters.state || "all_states"} onValueChange={(value) => setFilters({...filters, state: value === "all_states" ? "" : value})}>
              <SelectTrigger>
                <SelectValue placeholder="All states" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_states">All states</SelectItem>
                {states.map((state) => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filters.zone || "all_zones"} onValueChange={(value) => setFilters({...filters, zone: value === "all_zones" ? "" : value})}>
              <SelectTrigger>
                <SelectValue placeholder="All zones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_zones">All zones</SelectItem>
                {zoneTypes.map((zone) => (
                  <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Search postcode"
              value={filters.postcode}
              onChange={(e) => setFilters({...filters, postcode: e.target.value})}
            />

            <Select 
              value={filters.assemblyEligible === null ? "all_assembly" : filters.assemblyEligible.toString()}
              onValueChange={(value) => setFilters({...filters, assemblyEligible: value === "all_assembly" ? null : value === "true"})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Assembly" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_assembly">All</SelectItem>
                <SelectItem value="true">Eligible</SelectItem>
                <SelectItem value="false">Not Eligible</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.metro === null ? "all_area" : filters.metro.toString()}
              onValueChange={(value) => setFilters({...filters, metro: value === "all_area" ? null : value === "true"})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Area Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_area">All</SelectItem>
                <SelectItem value="true">Metro</SelectItem>
                <SelectItem value="false">Regional</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => setFilters({state: '', zone: '', postcode: '', assemblyEligible: null, metro: null})}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Zones Table */}
      <Card>
        <CardHeader>
          <CardTitle>Postcode Zones ({filteredZones.length})</CardTitle>
          <CardDescription>Manage delivery zones and service eligibility</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>State</TableHead>
                <TableHead>Postcode</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Lead Time</TableHead>
                <TableHead>Assembly</TableHead>
                <TableHead>Metro</TableHead>
                <TableHead>Remote</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredZones.slice(0, 50).map((zone) => (
                <TableRow key={zone.id}>
                  <TableCell>{zone.state}</TableCell>
                  <TableCell className="font-medium">{zone.postcode}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{zone.zone}</Badge>
                  </TableCell>
                  <TableCell>{zone.lead_time_days} days</TableCell>
                  <TableCell>
                    <Badge variant={zone.assembly_eligible ? "default" : "secondary"}>
                      {zone.assembly_eligible ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={zone.metro ? "default" : "secondary"}>
                      {zone.metro ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={zone.remote ? "destructive" : "secondary"}>
                      {zone.remote ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditZone(zone)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredZones.length > 50 && (
            <p className="text-sm text-muted-foreground mt-4">
              Showing first 50 of {filteredZones.length} results. Use filters to narrow down the list.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Edit Zone Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit Zone: {selectedZone?.postcode} ({selectedZone?.state})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label>Assembly Eligible</Label>
              <Switch
                checked={editData.assembly_eligible}
                onCheckedChange={(checked) => setEditData({...editData, assembly_eligible: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Delivery Eligible</Label>
              <Switch
                checked={editData.delivery_eligible}
                onCheckedChange={(checked) => setEditData({...editData, delivery_eligible: checked})}
              />
            </div>
            <div className="space-y-2">
              <Label>Lead Time (days)</Label>
              <Input
                type="number"
                value={editData.lead_time_days}
                onChange={(e) => setEditData({...editData, lead_time_days: parseInt(e.target.value) || 5})}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Metro Area</Label>
              <Switch
                checked={editData.metro}
                onCheckedChange={(checked) => setEditData({...editData, metro: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Remote Area</Label>
              <Switch
                checked={editData.remote}
                onCheckedChange={(checked) => setEditData({...editData, remote: checked})}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateZone} disabled={loading}>
              Update Zone
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ZoneManagement;