import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useShipping } from '@/hooks/useShipping';
import { Edit, Plus, Trash, Settings } from 'lucide-react';

interface RateCard {
  id: string;
  carrier: string;
  service_name: string;
  zone_from: string;
  zone_to: string;
  base_price: number;
  per_kg: number;
  per_cubic_m: number;
  minimum_charge: number;
  active: boolean;
  effective_from: string;
  effective_to?: string;
}

const CarrierManagement = () => {
  const { toast } = useToast();
  const { getRateCards, createRateCard, updateRateCard, getCarriers, loading } = useShipping();
  
  const [rateCards, setRateCards] = useState<RateCard[]>([]);
  const [carriers, setCarriers] = useState<string[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<RateCard | null>(null);
  const [filters, setFilters] = useState({ carrier: '', active: true });

  const [newRate, setNewRate] = useState({
    carrier: '',
    service_name: '',
    zone_from: '',
    zone_to: '',
    base_price: 0,
    per_kg: 0,
    per_cubic_m: 0,
    minimum_charge: 15.00,
    residential_surcharge: 25.00,
    tail_lift_fee: 45.00,
    effective_from: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      const [rateCardsData, carriersData] = await Promise.all([
        getRateCards(filters.carrier ? { carrier: filters.carrier, active: filters.active } : { active: filters.active }),
        getCarriers()
      ]);
      
      setRateCards(rateCardsData || []);
      setCarriers(carriersData || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load carrier data",
        variant: "destructive",
      });
    }
  };

  const handleCreateRate = async () => {
    try {
      await createRateCard(newRate);
      toast({
        title: "Success",
        description: "Rate card created successfully",
      });
      setIsCreateDialogOpen(false);
      setNewRate({
        carrier: '',
        service_name: '',
        zone_from: '',
        zone_to: '',
        base_price: 0,
        per_kg: 0,
        per_cubic_m: 0,
        minimum_charge: 15.00,
        residential_surcharge: 25.00,
        tail_lift_fee: 45.00,
        effective_from: new Date().toISOString().split('T')[0]
      });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create rate card",
        variant: "destructive",
      });
    }
  };

  const toggleRateCardStatus = async (card: RateCard) => {
    try {
      await updateRateCard(card.id, { active: !card.active });
      toast({
        title: "Success",
        description: `Rate card ${card.active ? 'disabled' : 'enabled'} successfully`,
      });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update rate card",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Carrier & Rate Management</h2>
          <p className="text-muted-foreground">Configure shipping carriers and rate cards</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Rate Card
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Rate Card</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="carrier">Carrier</Label>
                <Select value={newRate.carrier} onValueChange={(value) => setNewRate({...newRate, carrier: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select carrier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="startrack">StarTrack</SelectItem>
                    <SelectItem value="auspost">Australia Post</SelectItem>
                    <SelectItem value="tnt">TNT</SelectItem>
                    <SelectItem value="toll">Toll</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="service_name">Service Name</Label>
                <Input
                  value={newRate.service_name}
                  onChange={(e) => setNewRate({...newRate, service_name: e.target.value})}
                  placeholder="Express, Standard, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zone_from">From Zone</Label>
                <Input
                  value={newRate.zone_from}
                  onChange={(e) => setNewRate({...newRate, zone_from: e.target.value})}
                  placeholder="MELB, SYDN, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zone_to">To Zone</Label>
                <Input
                  value={newRate.zone_to}
                  onChange={(e) => setNewRate({...newRate, zone_to: e.target.value})}
                  placeholder="MELB, SYDN, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="base_price">Base Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newRate.base_price}
                  onChange={(e) => setNewRate({...newRate, base_price: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="per_kg">Per KG ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newRate.per_kg}
                  onChange={(e) => setNewRate({...newRate, per_kg: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="per_cubic_m">Per Cubic M ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newRate.per_cubic_m}
                  onChange={(e) => setNewRate({...newRate, per_cubic_m: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimum_charge">Minimum Charge ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newRate.minimum_charge}
                  onChange={(e) => setNewRate({...newRate, minimum_charge: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRate} disabled={loading}>
                Create Rate Card
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <Select value={filters.carrier || "all"} onValueChange={(value) => setFilters({...filters, carrier: value === "all" ? "" : value})}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All carriers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All carriers</SelectItem>
            {carriers.map((carrier) => (
              <SelectItem key={carrier} value={carrier}>
                {carrier}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.active.toString()} onValueChange={(value) => setFilters({...filters, active: value === 'true'})}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Active only</SelectItem>
            <SelectItem value="false">Inactive only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Rate Cards Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Cards</CardTitle>
          <CardDescription>Manage shipping rates for different carriers and zones</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Carrier</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Base Price</TableHead>
                <TableHead>Per KG</TableHead>
                <TableHead>Min Charge</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rateCards.map((card) => (
                <TableRow key={card.id}>
                  <TableCell className="font-medium">{card.carrier}</TableCell>
                  <TableCell>{card.service_name}</TableCell>
                  <TableCell>{card.zone_from} → {card.zone_to}</TableCell>
                  <TableCell>${card.base_price}</TableCell>
                  <TableCell>${card.per_kg}</TableCell>
                  <TableCell>${card.minimum_charge}</TableCell>
                  <TableCell>
                    <Badge variant={card.active ? "default" : "secondary"}>
                      {card.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRateCardStatus(card)}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCard(card)}
                      >
                        <Edit className="w-4 h-4" />
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
  );
};

export default CarrierManagement;