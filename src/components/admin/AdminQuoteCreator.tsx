import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Plus, Trash2, Send, Save, UserPlus, ShoppingCart } from "lucide-react";
import { SimpleItemAdder } from "@/components/admin/SimpleItemAdder";

interface QuoteItem {
  id: string;
  cabinet_type_id: string;
  cabinet_name: string;
  quantity: number;
  width_mm: number;
  height_mm: number;
  depth_mm: number;
  unit_price: number;
  total_price: number;
  configuration?: any;
  door_style_id?: string;
  color_id?: string;
  finish_id?: string;
}

interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  company: string;
  abn: string;
}

interface AdminQuoteCreatorProps {
  onQuoteCreated?: () => void;
}

export const AdminQuoteCreator = ({ onQuoteCreated }: AdminQuoteCreatorProps) => {
  const [open, setOpen] = useState(false);
  const [customer, setCustomer] = useState<CustomerDetails>({
    name: "",
    email: "",
    phone: "",
    company: "",
    abn: ""
  });
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [notes, setNotes] = useState("");
  const [validUntilDays, setValidUntilDays] = useState(30);
  const [sendImmediately, setSendImmediately] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showItemAdder, setShowItemAdder] = useState(false);
  
  const { toast } = useToast();

  const calculateTotals = () => {
    const subtotal = quoteItems.reduce((sum, item) => sum + item.total_price, 0);
    const taxAmount = subtotal * 0.1; // 10% GST
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const handleAddItem = (configuredItem: any) => {
    const newItem: QuoteItem = {
      id: crypto.randomUUID(),
      cabinet_type_id: configuredItem.cabinet_type_id,
      cabinet_name: configuredItem.name || "Cabinet",
      quantity: configuredItem.quantity || 1,
      width_mm: configuredItem.width_mm,
      height_mm: configuredItem.height_mm,
      depth_mm: configuredItem.depth_mm,
      unit_price: configuredItem.unit_price,
      total_price: configuredItem.total_price,
      configuration: configuredItem.configuration,
      door_style_id: configuredItem.door_style_id,
      color_id: configuredItem.color_id,
      finish_id: configuredItem.finish_id
    };
    
    setQuoteItems(prev => [...prev, newItem]);
    setShowItemAdder(false);
  };

  const handleRemoveItem = (itemId: string) => {
    setQuoteItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleCreateQuote = async (sendToCustomer: boolean = false) => {
    if (!customer.name || !customer.email || quoteItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in customer name, email, and add at least one item.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { subtotal, taxAmount, total } = calculateTotals();
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + validUntilDays);

      // Create the quote
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: customer.phone || null,
          customer_company: customer.company || null,
          customer_abn: customer.abn || null,
          subtotal,
          tax_amount: taxAmount,
          total_amount: total,
          notes,
          valid_until: validUntil.toISOString().split('T')[0],
          status: sendToCustomer ? 'sent' : 'draft',
          admin_created_by: (await supabase.auth.getUser()).data.user?.id,
          sent_at: sendToCustomer ? new Date().toISOString() : null
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Create quote items
      const quoteItemsData = quoteItems.map(item => ({
        quote_id: quote.id,
        cabinet_type_id: item.cabinet_type_id,
        quantity: item.quantity,
        width_mm: item.width_mm,
        height_mm: item.height_mm,
        depth_mm: item.depth_mm,
        unit_price: item.unit_price,
        total_price: item.total_price,
        configuration: item.configuration,
        door_style_id: item.door_style_id,
        color_id: item.color_id,
        finish_id: item.finish_id
      }));

      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(quoteItemsData);

      if (itemsError) throw itemsError;

      // Send notification if requested
      if (sendToCustomer) {
        try {
          await supabase.functions.invoke('send-quote-notification', {
            body: {
              quote_id: quote.id,
              customer_email: customer.email,
              customer_name: customer.name,
              quote_number: quote.quote_number,
              total_amount: total
            }
          });

          toast({
            title: "Quote Created & Sent",
            description: `Quote ${quote.quote_number} has been created and sent to ${customer.email}`
          });
        } catch (notificationError) {
          console.error('Notification error:', notificationError);
          toast({
            title: "Quote Created",
            description: `Quote ${quote.quote_number} has been created, but notification failed to send.`,
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Quote Saved",
          description: `Quote ${quote.quote_number} has been saved as draft`
        });
      }

      // Reset form
      setCustomer({
        name: "",
        email: "",
        phone: "",
        company: "",
        abn: ""
      });
      setQuoteItems([]);
      setNotes("");
      setValidUntilDays(30);
      setOpen(false);
      
      if (onQuoteCreated) {
        onQuoteCreated();
      }

    } catch (error) {
      console.error('Error creating quote:', error);
      toast({
        title: "Error",
        description: "Failed to create quote. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Quote
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Quote</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer-name">Name *</Label>
                <Input
                  id="customer-name"
                  value={customer.name}
                  onChange={(e) => setCustomer(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Customer name"
                />
              </div>
              <div>
                <Label htmlFor="customer-email">Email *</Label>
                <Input
                  id="customer-email"
                  type="email"
                  value={customer.email}
                  onChange={(e) => setCustomer(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="customer@example.com"
                />
              </div>
              <div>
                <Label htmlFor="customer-phone">Phone</Label>
                <Input
                  id="customer-phone"
                  value={customer.phone}
                  onChange={(e) => setCustomer(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <Label htmlFor="customer-company">Company</Label>
                <Input
                  id="customer-company"
                  value={customer.company}
                  onChange={(e) => setCustomer(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="Company name"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="customer-abn">ABN</Label>
                <Input
                  id="customer-abn"
                  value={customer.abn}
                  onChange={(e) => setCustomer(prev => ({ ...prev, abn: e.target.value }))}
                  placeholder="Australian Business Number"
                />
              </div>
            </CardContent>
          </Card>

          {/* Quote Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Quote Items
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowItemAdder(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {quoteItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No items added yet. Click "Add Item" to start building the quote.
                </div>
              ) : (
                <div className="space-y-3">
                  {quoteItems.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">#{index + 1}</Badge>
                          <span className="font-medium">{item.cabinet_name}</span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Qty: {item.quantity} | {item.width_mm}×{item.height_mm}×{item.depth_mm}mm
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${item.total_price.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">
                          ${item.unit_price.toLocaleString()} ea.
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id)}
                        className="ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (10%):</span>
                      <span>${taxAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>${total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quote Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Quote Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="quote-notes">Internal Notes</Label>
                <Textarea
                  id="quote-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Internal notes about this quote..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valid-days">Valid for (days)</Label>
                  <Select value={validUntilDays.toString()} onValueChange={(value) => setValidUntilDays(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleCreateQuote(false)}
              disabled={isSubmitting}
            >
              <Save className="w-4 h-4 mr-2" />
              Save as Draft
            </Button>
            <Button 
              onClick={() => handleCreateQuote(true)}
              disabled={isSubmitting}
            >
              <Send className="w-4 h-4 mr-2" />
              Create & Send to Customer
            </Button>
          </div>
        </div>

        {/* Simple Item Adder Dialog */}
        {showItemAdder && (
          <Dialog open={showItemAdder} onOpenChange={setShowItemAdder}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Cabinet to Quote</DialogTitle>
              </DialogHeader>
              <SimpleItemAdder
                onItemAdd={handleAddItem}
                onCancel={() => setShowItemAdder(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};