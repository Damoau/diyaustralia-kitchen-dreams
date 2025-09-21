import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileAttachments } from './FileAttachments';
import { Quote, QuoteItem } from '@/hooks/useQuotes';
import { Plus, Trash2, Mail } from 'lucide-react';

interface QuoteEditorProps {
  quote: Quote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuoteUpdated: () => void;
}

export const QuoteEditor = ({ quote, open, onOpenChange, onQuoteUpdated }: QuoteEditorProps) => {
  const [loading, setLoading] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [formData, setFormData] = useState<Partial<Quote>>({});
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [cabinetTypes, setCabinetTypes] = useState<any[]>([]);
  const [doorStyles, setDoorStyles] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [finishes, setFinishes] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (quote) {
      setFormData(quote);
      setItems(quote.quote_items || quote.items || []);
      loadOptions();
    }
  }, [quote]);

  const loadOptions = async () => {
    const [cabinetRes, doorRes, colorRes, finishRes] = await Promise.all([
      supabase.from('cabinet_types').select('id, name').eq('active', true),
      supabase.from('door_styles').select('id, name').eq('active', true),
      supabase.from('colors').select('id, name').eq('active', true),
      supabase.from('finishes').select('id, name').eq('active', true)
    ]);

    if (cabinetRes.data) setCabinetTypes(cabinetRes.data);
    if (doorRes.data) setDoorStyles(doorRes.data);
    if (colorRes.data) setColors(colorRes.data);
    if (finishRes.data) setFinishes(finishRes.data);
  };

  const addItem = () => {
    setItems([...items, {
      cabinet_type_id: '',
      quote_id: quote?.id || '',
      width_mm: 600,
      height_mm: 720,
      depth_mm: 560,
      quantity: 1,
      unit_price: 0,
      total_price: 0
    }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate total price when quantity or unit price changes
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total_price = newItems[index].quantity * newItems[index].unit_price;
    }
    
    setItems(newItems);
    calculateTotals(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    calculateTotals(newItems);
  };

  const calculateTotals = (currentItems: QuoteItem[]) => {
    const subtotal = currentItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
    const taxAmount = subtotal * 0.10; // 10% GST
    const totalAmount = subtotal + taxAmount;

    setFormData(prev => ({
      ...prev,
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount
    }));
  };

  const saveQuote = async () => {
    if (!quote?.id) return;
    
    setLoading(true);
    try {
      // Update quote
      const { error: quoteError } = await supabase
        .from('quotes')
        .update({
          customer_email: formData.customer_email,
          status: formData.status,
          subtotal: formData.subtotal,
          tax_amount: formData.tax_amount,
          total_amount: formData.total_amount,
          valid_until: formData.valid_until,
          notes: formData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', quote.id);

      if (quoteError) throw quoteError;

      // Update items - delete existing and insert new ones
      await supabase.from('quote_items').delete().eq('quote_id', quote.id);
      
      if (items.length > 0) {
        const itemsToInsert = items.map(item => ({
          quote_id: quote.id,
          cabinet_type_id: item.cabinet_type_id,
          door_style_id: item.door_style_id,
          color_id: item.color_id,
          finish_id: item.finish_id,
          width_mm: item.width_mm,
          height_mm: item.height_mm,
          depth_mm: item.depth_mm,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          configuration: item.configuration
        }));

        const { error: itemsError } = await supabase
          .from('quote_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      toast({
        title: "Success",
        description: "Quote updated successfully"
      });

      onQuoteUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating quote:', error);
      toast({
        title: "Error",
        description: "Failed to update quote",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendQuoteEmail = async () => {
    if (!quote?.id || !formData.customer_email) return;

    setEmailSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-quote-notification', {
        body: {
          quote_id: quote.id,
          customer_email: formData.customer_email,
          customer_name: formData.customer_email.split('@')[0],
          notification_type: 'updated'
        }
      });

      if (error) throw error;

      // Update quote status to 'sent'
      await supabase
        .from('quotes')
        .update({ status: 'sent' })
        .eq('id', quote.id);

      toast({
        title: "Success",
        description: "Quote email sent successfully"
      });

      onQuoteUpdated();
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Error",
        description: "Failed to send quote email",
        variant: "destructive"
      });
    } finally {
      setEmailSending(false);
    }
  };

  if (!quote) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Quote: {quote.quote_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quote Details */}
          <Card>
            <CardHeader>
              <CardTitle>Quote Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Customer Email</Label>
                  <Input
                    value={formData.customer_email || ''}
                    onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valid Until</Label>
                  <Input
                    type="date"
                    value={formData.valid_until?.split('T')[0] || ''}
                    onChange={(e) => setFormData({ ...formData, valid_until: new Date(e.target.value).toISOString() })}
                  />
                </div>
                <div>
                  <Label>Total Amount</Label>
                  <div className="text-lg font-bold">${formData.total_amount?.toFixed(2) || '0.00'}</div>
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Internal notes and quote details..."
                />
              </div>
            </CardContent>
          </Card>

          {/* File Attachments */}
          <Card>
            <CardHeader>
              <CardTitle>Client Drawings & Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <FileAttachments
                scope="quote"
                scopeId={quote.id}
                onFilesChange={() => {
                  // Refresh attachments
                }}
              />
            </CardContent>
          </Card>

          {/* Quote Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Quote Items</CardTitle>
              <Button onClick={addItem} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="border p-4 rounded-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    <Button variant="ghost" size="sm" onClick={() => removeItem(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Cabinet Type</Label>
                      <Select value={item.cabinet_type_id} onValueChange={(value) => updateItem(index, 'cabinet_type_id', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select cabinet type" />
                        </SelectTrigger>
                        <SelectContent>
                          {cabinetTypes.map(type => (
                            <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label>Width (mm)</Label>
                        <Input
                          type="number"
                          value={item.width_mm}
                          onChange={(e) => updateItem(index, 'width_mm', parseInt(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Height (mm)</Label>
                        <Input
                          type="number"
                          value={item.height_mm}
                          onChange={(e) => updateItem(index, 'height_mm', parseInt(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Depth (mm)</Label>
                        <Input
                          type="number"
                          value={item.depth_mm}
                          onChange={(e) => updateItem(index, 'depth_mm', parseInt(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Unit Price ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Total ($)</Label>
                        <div className="text-lg font-bold pt-2">{item.total_price?.toFixed(2) || '0.00'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${formData.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (10%):</span>
                  <span>${formData.tax_amount?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>${formData.total_amount?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between">
            <div className="space-x-2">
              <Button onClick={saveQuote} disabled={loading}>
                {loading ? 'Saving...' : 'Save Quote'}
              </Button>
              <Button 
                variant="outline" 
                onClick={sendQuoteEmail} 
                disabled={emailSending || !formData.customer_email}
              >
                <Mail className="w-4 h-4 mr-2" />
                {emailSending ? 'Sending...' : 'Send Email'}
              </Button>
            </div>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};