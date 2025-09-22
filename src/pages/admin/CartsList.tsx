import React, { useState } from 'react';
import { DataTable } from '@/components/admin/shared/DataTable';
import { StatusChip } from '@/components/admin/shared/StatusChip';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, ShoppingCart, Calendar, DollarSign } from 'lucide-react';
import { useAdminCarts, AdminCartData } from '@/hooks/useAdminCarts';
import { format } from 'date-fns';
import { toast } from 'sonner';

const CartsList = () => {
  const { carts, isLoading, sendFollowUpEmail } = useAdminCarts();
  const [selectedCart, setSelectedCart] = useState<AdminCartData | null>(null);
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const handleSendEmail = async () => {
    if (!selectedCart || !emailMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setSendingEmail(true);
    const success = await sendFollowUpEmail(
      selectedCart.id, 
      selectedCart.customer_email, 
      emailMessage
    );
    
    if (success) {
      setSelectedCart(null);
      setEmailMessage('');
    }
    setSendingEmail(false);
  };

  const columns = [
    { 
      key: 'customer_name' as keyof AdminCartData, 
      label: 'Customer',
      render: (value: string, row: AdminCartData) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground">{row.customer_email}</div>
        </div>
      )
    },
    { key: 'label' as keyof AdminCartData, label: 'Cart Name' },
    { 
      key: 'status' as keyof AdminCartData, 
      label: 'Status',
      render: (value: string) => <StatusChip status={value} />
    },
    {
      key: 'items_count' as keyof AdminCartData,
      label: 'Items',
      render: (value: number) => (
        <div className="flex items-center">
          <ShoppingCart className="mr-1 h-4 w-4" />
          {value}
        </div>
      )
    },
    {
      key: 'total_amount' as keyof AdminCartData,
      label: 'Value',
      render: (value: number) => (
        <div className="flex items-center font-medium">
          <DollarSign className="mr-1 h-4 w-4" />
          ${value.toFixed(2)}
        </div>
      )
    },
    {
      key: 'updated_at' as keyof AdminCartData,
      label: 'Last Updated',
      render: (value: string) => (
        <div className="flex items-center text-sm">
          <Calendar className="mr-1 h-4 w-4" />
          {format(new Date(value), 'MMM dd, yyyy')}
        </div>
      )
    },
    {
      key: 'id' as keyof AdminCartData,
      label: 'Actions',
      render: (value: string, row: AdminCartData) => (
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCart(row);
                setEmailMessage(`Hi ${row.customer_name},

I noticed you have some items in your cart that you might be interested in completing your purchase for. 

Your cart contains ${row.items_count} items worth $${row.total_amount.toFixed(2)}.

If you have any questions or need assistance with your order, please don't hesitate to reach out.

Best regards,
Kitchen Cabinets Team`);
              }}
            >
              <Mail className="mr-1 h-4 w-4" />
              Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Follow-up Email</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <strong>Customer:</strong> {row.customer_name} ({row.customer_email})
              </div>
              <div>
                <strong>Cart:</strong> {row.label} - ${row.total_amount.toFixed(2)} ({row.items_count} items)
              </div>
              <Textarea
                placeholder="Enter your message..."
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={8}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSendEmail}
                  disabled={sendingEmail || !emailMessage.trim()}
                >
                  {sendingEmail ? 'Sending...' : 'Send Email'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Customer Carts</h1>
        <p className="text-muted-foreground">View saved and abandoned carts, reach out to customers</p>
      </div>
      
      <DataTable
        data={carts}
        columns={columns}
        selectable
        loading={isLoading}
        emptyState={<div>No saved or abandoned carts found</div>}
      />
    </div>
  );
};

export default CartsList;