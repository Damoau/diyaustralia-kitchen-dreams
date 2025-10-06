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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdminImpersonation } from "@/contexts/AdminImpersonationContext";
import { CalendarIcon, Plus, Trash2, Send, Save, UserPlus, ShoppingCart, ExternalLink, AlertTriangle } from "lucide-react";

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
  const [showFrontendMode, setShowFrontendMode] = useState(false);
  const [createdQuoteId, setCreatedQuoteId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { startImpersonation, redirectToFrontend } = useAdminImpersonation();

  const calculateTotals = () => {
    // All prices from the pricing calculator already include GST
    // So we need to extract the GST, not add it
    const totalIncGST = quoteItems.reduce((sum, item) => sum + item.total_price, 0);
    const subtotal = totalIncGST / 1.1; // Extract GST (ex GST)
    const taxAmount = totalIncGST - subtotal; // Calculate GST amount
    return { subtotal, taxAmount, total: totalIncGST };
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
  };

  const handleRemoveItem = (itemId: string) => {
    setQuoteItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleCreateQuote = async (mode: 'draft' | 'frontend' | 'send' = 'draft') => {
    if (!customer.name || !customer.email) {
      toast({
        title: "Validation Error",
        description: "Please fill in customer name and email.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { subtotal, taxAmount, total } = calculateTotals();
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + validUntilDays);

      // Check if customer exists in auth.users by email
      const { data: existingUser, error: userError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', customer.email)
        .single();

      let customerUserId = null;
      if (!userError && existingUser) {
        customerUserId = existingUser.user_id;
      }

      // Create the quote
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          user_id: customerUserId, // Link to customer if they have account
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
          status: mode === 'send' ? 'sent' : 'draft',
          admin_created_by: (await supabase.auth.getUser()).data.user?.id,
          sent_at: mode === 'send' ? new Date().toISOString() : null
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

      // Handle different modes
      if (mode === 'frontend') {
        // Set up for frontend mode
        setCreatedQuoteId(quote.id);
        setShowFrontendMode(true);
        
        toast({
          title: "Quote Created",
          description: `Quote ${quote.quote_number} created. Ready to switch to frontend mode.`
        });
        
        return;
      } else if (mode === 'send') {
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

      // Reset form if not going to frontend mode  
      if (mode === 'draft' || mode === 'send') {
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
      }
      
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

  const handleContinueToFrontend = async () => {
    if (!createdQuoteId || !customer.email) return;
    
    const success = await startImpersonation(customer.email, createdQuoteId);
    if (success) {
      setOpen(false);
      setShowFrontendMode(false);
      redirectToFrontend();
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
              onClick={() => handleCreateQuote('draft')}
              disabled={isSubmitting}
            >
              <Save className="w-4 h-4 mr-2" />
              Save as Draft
            </Button>
            <Button 
              variant="secondary"
              onClick={() => handleCreateQuote('frontend')}
              disabled={isSubmitting || !customer.name || !customer.email}
              title={!customer.name || !customer.email ? "Please fill in customer name and email first" : ""}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Continue to Front-End
            </Button>
            <Button 
              onClick={() => handleCreateQuote('send')}
              disabled={isSubmitting}
            >
              <Send className="w-4 h-4 mr-2" />
              Create & Send to Customer
            </Button>
          </div>
        </div>

        {/* Frontend Mode Confirmation Dialog */}
        {showFrontendMode && (
          <Dialog open={showFrontendMode} onOpenChange={setShowFrontendMode}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Switch to Front-End Mode</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You will now enter impersonation mode as <strong>{customer.email}</strong> to add products to quote <strong>{createdQuoteId?.slice(0, 8)}...</strong>
                  </AlertDescription>
                </Alert>
                <p className="text-sm text-muted-foreground">
                  In front-end mode, you can use the full product configurator to add cabinets with custom sizing, door styles, colors, and hardware options.
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowFrontendMode(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleContinueToFrontend}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Continue to Front-End
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};