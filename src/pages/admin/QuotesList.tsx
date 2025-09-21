import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/admin/shared/DataTable';
import { StatusChip } from '@/components/admin/shared/StatusChip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuotes, Quote, QuoteStats } from '@/hooks/useQuotes';
import { AdminQuoteCreator } from '@/components/admin/AdminQuoteCreator';
import { Search, FileText, Eye, CheckCircle, XCircle } from 'lucide-react';

const QuotesList = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [stats, setStats] = useState<QuoteStats>({ total: 0, pending: 0, approved: 0, totalValue: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'convert' | null>(null);
  const [actionNotes, setActionNotes] = useState('');

  const { loading, getQuotes, getQuoteStats, updateQuoteStatus, convertQuoteToOrder } = useQuotes();

  useEffect(() => {
    loadData();
  }, [statusFilter, searchTerm]);

  const loadData = async () => {
    const [quotesData, statsData] = await Promise.all([
      getQuotes({ status: statusFilter, search: searchTerm, adminView: true }),
      getQuoteStats()
    ]);
    setQuotes(quotesData);
    setStats(statsData);
  };

  const handleQuoteAction = async () => {
    if (!selectedQuote || !actionType) return;

    let success = false;
    
    if (actionType === 'convert') {
      success = await convertQuoteToOrder(selectedQuote.id);
    } else {
      const newStatus = actionType === 'approve' ? 'approved' : 'rejected';
      success = await updateQuoteStatus(selectedQuote.id, newStatus, actionNotes);
    }

    if (success) {
      setDialogOpen(false);
      setSelectedQuote(null);
      setActionType(null);
      setActionNotes('');
      await loadData();
    }
  };

  const openActionDialog = (quote: Quote, action: 'approve' | 'reject' | 'convert') => {
    setSelectedQuote(quote);
    setActionType(action);
    setDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-500',
      sent: 'bg-blue-500', 
      approved: 'bg-green-500',
      rejected: 'bg-red-500',
      expired: 'bg-orange-500',
      converted: 'bg-purple-500'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  const columns = [
    { key: 'quote_number' as keyof Quote, label: 'Quote Number' },
    { 
      key: 'customer_details' as keyof Quote, 
      label: 'Customer',
      render: (value: Quote['customer_details']) => value?.name || 'Unknown Customer'
    },
    { 
      key: 'total_amount' as keyof Quote, 
      label: 'Total',
      render: (value: number) => `$${value.toLocaleString()}`
    },
    { 
      key: 'status' as keyof Quote, 
      label: 'Status',
      render: (value: string) => <StatusChip status={value} />
    },
    { 
      key: 'created_at' as keyof Quote, 
      label: 'Created',
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    { 
      key: 'valid_until' as keyof Quote, 
      label: 'Valid Until',
      render: (value: string) => <Badge variant="outline">{new Date(value).toLocaleDateString()}</Badge>
    },
    {
      key: 'id' as keyof Quote,
      label: 'Actions',
      render: (value: string, quote: Quote) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openActionDialog(quote, 'approve')}>
            <CheckCircle className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => openActionDialog(quote, 'reject')}>
            <XCircle className="w-4 h-4" />
          </Button>
          {quote.status === 'approved' && (
            <Button size="sm" onClick={() => openActionDialog(quote, 'convert')}>
              Convert
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Quotes</h1>
          <p className="text-muted-foreground">Manage customer quotes and approvals</p>
        </div>
        <AdminQuoteCreator onQuoteCreated={loadData} />
      </div>
      
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Ready for orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search quotes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <DataTable
        data={quotes}
        columns={columns}
        loading={loading}
        selectable
        emptyState={
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No quotes found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' 
                ? "Try adjusting your search or filter criteria."
                : "No quotes have been created yet."
              }
            </p>
          </div>
        }
      />

      {/* Action Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Approve Quote'}
              {actionType === 'reject' && 'Reject Quote'}
              {actionType === 'convert' && 'Convert Quote to Order'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedQuote && (
            <div className="space-y-4">
              <div>
                <Label>Quote: {selectedQuote.quote_number}</Label>
                <p className="text-sm text-muted-foreground">
                  Customer: {selectedQuote.customer_details?.name || 'Unknown'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Amount: ${selectedQuote.total_amount.toLocaleString()}
                </p>
              </div>
              
              <div>
                <Label htmlFor="action-notes">
                  {actionType === 'convert' ? 'Order Notes (Optional)' : 'Reason (Optional)'}
                </Label>
                <Textarea
                  id="action-notes"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder={`Add notes for this ${actionType}...`}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleQuoteAction} disabled={loading}>
                  {actionType === 'approve' && 'Approve Quote'}
                  {actionType === 'reject' && 'Reject Quote'}
                  {actionType === 'convert' && 'Convert to Order'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuotesList;