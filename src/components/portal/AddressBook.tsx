import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2,
  Home,
  Building,
  Star
} from "lucide-react";

interface Address {
  id: string;
  name: string;
  type: "billing" | "shipping";
  line1: string;
  line2?: string;
  suburb: string;
  state: string;
  postcode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
}

export const AddressBook = () => {
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: "1",
      name: "Home Address",
      type: "billing",
      line1: "123 Collins Street",
      line2: "Apt 4B",
      suburb: "Melbourne",
      state: "VIC",
      postcode: "3000",
      country: "Australia",
      phone: "+61 400 123 456",
      isDefault: true
    },
    {
      id: "2", 
      name: "Work Address",
      type: "shipping",
      line1: "456 Queen Street",
      line2: "",
      suburb: "Brisbane",
      state: "QLD",
      postcode: "4000",
      country: "Australia",
      phone: "+61 400 789 012",
      isDefault: false
    }
  ]);

  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const australianStates = [
    { value: "NSW", label: "New South Wales" },
    { value: "VIC", label: "Victoria" },
    { value: "QLD", label: "Queensland" },
    { value: "SA", label: "South Australia" },
    { value: "WA", label: "Western Australia" },
    { value: "TAS", label: "Tasmania" },
    { value: "NT", label: "Northern Territory" },
    { value: "ACT", label: "Australian Capital Territory" }
  ];

  const validatePostcode = (postcode: string, state: string) => {
    const postcodeRanges: Record<string, [number, number][]> = {
      NSW: [[1000, 1999], [2000, 2599], [2619, 2899], [2921, 2999]],
      VIC: [[3000, 3999], [8000, 8999]],
      QLD: [[4000, 4999], [9000, 9999]],
      SA: [[5000, 5999]],
      WA: [[6000, 6797], [6800, 6999]],
      TAS: [[7000, 7999]],
      NT: [[800, 999]],
      ACT: [[200, 299], [2600, 2618], [2900, 2920]]
    };

    const code = parseInt(postcode);
    const ranges = postcodeRanges[state] || [];
    
    return ranges.some(([min, max]) => code >= min && code <= max);
  };

  const handleSaveAddress = (addressData: Partial<Address>) => {
    if (!addressData.postcode || !addressData.state || !validatePostcode(addressData.postcode, addressData.state)) {
      toast({
        title: "Invalid postcode",
        description: "Please enter a valid postcode for the selected state.",
        variant: "destructive"
      });
      return;
    }

    if (editingAddress) {
      // Update existing address
      setAddresses(addresses.map(addr => 
        addr.id === editingAddress.id 
          ? { ...addr, ...addressData }
          : addr
      ));
      toast({
        title: "Address updated",
        description: "Your address has been successfully updated.",
      });
    } else {
      // Create new address
      const newAddress: Address = {
        id: Date.now().toString(),
        name: addressData.name || "New Address",
        type: addressData.type || "shipping",
        line1: addressData.line1 || "",
        line2: addressData.line2,
        suburb: addressData.suburb || "",
        state: addressData.state || "",
        postcode: addressData.postcode || "",
        country: addressData.country || "Australia",
        phone: addressData.phone,
        isDefault: addressData.isDefault || false
      };
      
      setAddresses([...addresses, newAddress]);
      toast({
        title: "Address added",
        description: "Your new address has been saved.",
      });
    }

    setEditingAddress(null);
    setIsDialogOpen(false);
  };

  const handleDeleteAddress = (addressId: string) => {
    setAddresses(addresses.filter(addr => addr.id !== addressId));
    toast({
      title: "Address deleted",
      description: "The address has been removed from your address book.",
    });
  };

  const handleSetDefault = (addressId: string) => {
    setAddresses(addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === addressId
    })));
    toast({
      title: "Default address updated",
      description: "Your default address has been changed.",
    });
  };

  const getAddressIcon = (type: string) => {
    return type === "billing" ? <Building className="w-4 h-4" /> : <Home className="w-4 h-4" />;
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      billing: { variant: "secondary" as const, text: "Billing" },
      shipping: { variant: "default" as const, text: "Shipping" }
    };
    
    const config = variants[type as keyof typeof variants] || variants.shipping;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Address Book</h1>
          <p className="text-muted-foreground mt-2">
            Manage your billing and shipping addresses.
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingAddress(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Address
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? "Edit Address" : "Add New Address"}
              </DialogTitle>
            </DialogHeader>
            <AddressForm
              address={editingAddress}
              states={australianStates}
              onSave={handleSaveAddress}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Addresses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {addresses.map((address) => (
          <Card key={address.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getAddressIcon(address.type)}
                  <CardTitle className="text-lg">{address.name}</CardTitle>
                  {address.isDefault && (
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  )}
                </div>
                {getTypeBadge(address.type)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  {address.line1}
                  {address.line2 && <br />}
                  {address.line2}
                </p>
                <p className="text-sm">
                  {address.suburb}, {address.state} {address.postcode}
                </p>
                <p className="text-sm">{address.country}</p>
                {address.phone && (
                  <p className="text-sm text-muted-foreground">{address.phone}</p>
                )}
                
                {address.isDefault && (
                  <Badge variant="outline" className="text-xs">
                    Default Address
                  </Badge>
                )}
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setEditingAddress(address);
                    setIsDialogOpen(true);
                  }}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                
                {!address.isDefault && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSetDefault(address.id)}
                  >
                    <Star className="w-3 h-3 mr-1" />
                    Set Default
                  </Button>
                )}
                
                {addresses.length > 1 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteAddress(address.id)}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {addresses.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No addresses saved</h3>
            <p className="text-muted-foreground mb-4">
              Add your first address to get started with orders and deliveries.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Address
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

interface AddressFormProps {
  address: Address | null;
  states: { value: string; label: string }[];
  onSave: (address: Partial<Address>) => void;
  onCancel: () => void;
}

const AddressForm = ({ address, states, onSave, onCancel }: AddressFormProps) => {
  const [formData, setFormData] = useState<Partial<Address>>(
    address || {
      name: "",
      type: "shipping",
      line1: "",
      line2: "",
      suburb: "",
      state: "",
      postcode: "",
      country: "Australia",
      phone: "",
      isDefault: false
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Address Name</Label>
        <Input
          id="name"
          value={formData.name || ""}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Home, Work, etc."
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Address Type</Label>
        <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as "billing" | "shipping" })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="shipping">Shipping</SelectItem>
            <SelectItem value="billing">Billing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="line1">Address Line 1</Label>
        <Input
          id="line1"
          value={formData.line1 || ""}
          onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
          placeholder="Street number and name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="line2">Address Line 2 (Optional)</Label>
        <Input
          id="line2"
          value={formData.line2 || ""}
          onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
          placeholder="Apartment, suite, etc."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="suburb">Suburb</Label>
          <Input
            id="suburb"
            value={formData.suburb || ""}
            onChange={(e) => setFormData({ ...formData, suburb: e.target.value })}
            placeholder="Suburb"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="postcode">Postcode</Label>
          <Input
            id="postcode"
            value={formData.postcode || ""}
            onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
            placeholder="0000"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="state">State</Label>
        <Select value={formData.state} onValueChange={(value) => setFormData({ ...formData, state: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select a state" />
          </SelectTrigger>
          <SelectContent>
            {states.map((state) => (
              <SelectItem key={state.value} value={state.value}>
                {state.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone (Optional)</Label>
        <Input
          id="phone"
          value={formData.phone || ""}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+61 400 000 000"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isDefault"
          checked={formData.isDefault || false}
          onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
        />
        <Label htmlFor="isDefault">Set as default address</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {address ? "Update Address" : "Add Address"}
        </Button>
      </div>
    </form>
  );
};