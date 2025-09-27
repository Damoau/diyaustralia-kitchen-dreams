import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useQuotes } from '@/hooks/useQuotes';
import { QuoteToCartConverter } from '@/components/portal/QuoteToCartConverter';
import { FileText, Clock, CheckCircle, XCircle, ArrowLeft, ShoppingCart, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const QuoteStatus = () => {
  const { quoteId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quote, setQuote] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (quoteId) {
      fetchQuoteDetails();
    }
  }, [quoteId]);

  const fetchQuoteDetails = async () => {
    setIsLoading(true);
    try {
      // This would typically be a dedicated hook or API call
      // For now, using the existing getQuotes function with filtering
      const { getQuotes } = useQuotes();
      const quotes = await getQuotes();
      const foundQuote = quotes.find((q: any) => q.id === quoteId);
      
      if (foundQuote) {
        setQuote(foundQuote);
      } else {
        toast({
          title: "Quote not found",
          description: "The requested quote could not be found.",
          variant: "destructive"
        });
        navigate('/portal/quotes');
      }
    } catch (error) {
      console.error('Error fetching quote details:', error);
      toast({
        title: "Error",
        description: "Failed to load quote details.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Clock className="h-4 w-4" />;
      case 'sent':
        return <FileText className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, label: 'Draft' },
      sent: { variant: 'default' as const, label: 'Under Review' },
      approved: { variant: 'default' as const, label: 'Approved' },
      rejected: { variant: 'destructive' as const, label: 'Rejected' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'outline' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Quote not found</p>
            <Button className="mt-4" onClick={() => navigate('/portal/quotes')}>
              Back to Quotes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/portal/quotes')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Quotes
        </Button>
        
        <div>
          <h1 className="text-3xl font-bold">Quote {quote.quote_number}</h1>
          <p className="text-muted-foreground">Created {formatDistanceToNow(new Date(quote.created_at), { addSuffix: true })}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quote Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(quote.status)}
              Quote Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Current Status:</span>
              {getStatusBadge(quote.status)}
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Quote Created:</span>
                <span>{new Date(quote.created_at).toLocaleDateString()}</span>
              </div>
              
              {quote.sent_at && (
                <div className="flex justify-between text-sm">
                  <span>Sent for Review:</span>
                  <span>{new Date(quote.sent_at).toLocaleDateString()}</span>
                </div>
              )}
              
              {quote.valid_until && (
                <div className="flex justify-between text-sm">
                  <span>Valid Until:</span>
                  <span className={new Date(quote.valid_until) < new Date() ? 'text-destructive' : ''}>
                    {new Date(quote.valid_until).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            
            <Separator />
            
            <div className="text-center space-y-3">
              <div>
                <p className="text-2xl font-bold">${quote.total_amount?.toFixed(2) || '0.00'}</p>
                <p className="text-sm text-muted-foreground">Total Quote Value</p>
              </div>
              
              {/* 20% Deposit Highlight */}
              <div className="bg-gradient-to-r from-primary/10 to-primary-glow/10 border border-primary/20 rounded-lg p-3">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Badge variant="default" className="bg-primary hover:bg-primary">
                    20% Deposit Required
                  </Badge>
                </div>
                <p className="text-lg font-semibold text-primary">
                  ${((quote.total_amount || 0) * 0.2).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  To secure your order
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quote Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Available Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quote.status === 'approved' && quote.quote_items && (
              <QuoteToCartConverter
                quoteId={quote.id}
                items={quote.quote_items}
              />
            )}
            
            {quote.status === 'sent' && (
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Your quote is being reviewed by our team. We'll notify you once it's ready.
                </p>
              </div>
            )}
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/portal/messages')}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact Sales Team
            </Button>
          </CardContent>
        </Card>

        {/* Quote Details */}
        <Card>
          <CardHeader>
            <CardTitle>Quote Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Quote Number:</span>
                <span className="font-mono">{quote.quote_number}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Items:</span>
                <span>{quote.quote_items?.length || 0} items</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${quote.subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Tax:</span>
                <span>${quote.tax_amount?.toFixed(2) || '0.00'}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span>${quote.total_amount?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
            
            {quote.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-2">Notes:</p>
                  <p className="text-sm text-muted-foreground">{quote.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quote Items */}
      {quote.quote_items && quote.quote_items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quote Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quote.quote_items.map((item: any, index: number) => (
                <div key={item.id || index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.cabinet_type?.name || 'Cabinet'}</h4>
                    <p className="text-sm text-muted-foreground">
                      {item.width_mm} × {item.height_mm} × {item.depth_mm}mm
                    </p>
                    {item.door_style?.name && (
                      <p className="text-xs text-muted-foreground">Door: {item.door_style.name}</p>
                    )}
                    {item.color?.name && (
                      <p className="text-xs text-muted-foreground">Color: {item.color.name}</p>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <p className="font-medium">Qty: {item.quantity}</p>
                    <p className="text-sm text-muted-foreground">${item.unit_price?.toFixed(2)} each</p>
                    <p className="font-semibold">${item.total_price?.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuoteStatus;