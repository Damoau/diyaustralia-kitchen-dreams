import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { QuoteToCartConverter } from "@/components/portal/QuoteToCartConverter";
import { QuoteChangeRequestDialog } from "@/components/portal/QuoteChangeRequestDialog";
import { 
  FileText, 
  Download, 
  DollarSign, 
  Calendar,
  MessageSquare,
  CheckCircle,
  CreditCard,
  Upload,
  ShoppingCart
} from "lucide-react";

interface QuoteDetailProps {
  quoteId: string;
}

export const QuoteDetail = ({ quoteId }: QuoteDetailProps) => {
  const [selectedVersion, setSelectedVersion] = useState(2);
  const [changeRequest, setChangeRequest] = useState("");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmittingChange, setIsSubmittingChange] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchQuoteData();
  }, [quoteId]);

  const fetchQuoteData = async () => {
    try {
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          *,
          quote_items (
            *,
            cabinet_types (
              name,
              category
            ),
            door_styles (
              name
            ),
            colors (
              name
            ),
            finishes (
              name
            )
          )
        `)
        .eq('id', quoteId)
        .single();

      if (quoteError) throw quoteError;

      // Mark quote as viewed if not already viewed
      if (!quoteData.viewed_at) {
        await supabase
          .from('quotes')
          .update({ viewed_at: new Date().toISOString() })
          .eq('id', quoteId);
      }

      setQuote(quoteData);
    } catch (error) {
      console.error('Error fetching quote:', error);
      toast({
        title: "Error",
        description: "Failed to load quote details.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading quote details...</p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Quote Not Found</h3>
        <p className="text-muted-foreground">The requested quote could not be found.</p>
      </div>
    );
  }

  // Use real quote data instead of mock data
  const quoteDisplay = {
    id: quote.id,
    label: quote.customer_name || "Kitchen Quote",
    status: quote.status,
    amount: quote.total_amount,
    depositAmount: Math.round(quote.total_amount * 0.2), // 20% deposit
    validUntil: new Date(quote.valid_until).toLocaleDateString(),
    createdAt: new Date(quote.created_at).toLocaleDateString(),
    currentVersion: quote.version_number || 1,
    quote_number: quote.quote_number,
    items: quote.quote_items || []
  };

  

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: { variant: "outline" as const, text: "Draft" },
      sent: { variant: "secondary" as const, text: "Sent" },
      viewed: { variant: "default" as const, text: "Viewed" },
      approved: { variant: "default" as const, text: "Approved" },
      accepted: { variant: "default" as const, text: "Accepted" },
      rejected: { variant: "destructive" as const, text: "Rejected" },
      expired: { variant: "destructive" as const, text: "Expired" }
    };
    
    const config = variants[status as keyof typeof variants] || variants.draft;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const handleAcceptQuote = () => {
    setShowPaymentDialog(true);
  };

  const handlePayDeposit = () => {
    // In real app, this would integrate with Stripe
    console.log("Processing deposit payment:", quote.depositAmount);
    setShowPaymentDialog(false);
  };

  const handleRequestSubmitted = () => {
    // Refresh quote data to show updated status/version
    fetchQuoteData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{quoteDisplay.quote_number}</h1>
          <p className="text-muted-foreground mt-2">{quoteDisplay.label}</p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(quoteDisplay.status)}
          <Badge variant="outline">v{quoteDisplay.currentVersion}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quote Actions */}
          {quoteDisplay.status === "sent" && (
            <Card>
              <CardHeader>
                <CardTitle>Quote Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button onClick={handleAcceptQuote} className="w-full">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept Quote
                  </Button>
                  
                  <QuoteToCartConverter
                    quoteId={quoteDisplay.id}
                    quoteNumber={quoteDisplay.quote_number}
                    totalAmount={quoteDisplay.amount}
                    items={quoteDisplay.items}
                  />
                </div>
                
                <QuoteChangeRequestDialog 
                  quoteId={quoteDisplay.id}
                  onRequestSubmitted={handleRequestSubmitted}
                >
                  <Button variant="outline" className="w-full">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Request Changes
                  </Button>
                </QuoteChangeRequestDialog>
              </CardContent>
            </Card>
          )}

          {/* Quote Items */}
          <Card>
            <CardHeader>
              <CardTitle>Quote Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {quoteDisplay.items.map((item: any, index: number) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.cabinet_types?.name || 'Cabinet'}</p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity} | {item.width_mm}×{item.height_mm}×{item.depth_mm}mm
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${item.total_price.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">${item.unit_price.toLocaleString()} ea.</p>
                    </div>
                  </div>
                ))}
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Subtotal:</span>
                    <span>${quote.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>GST (10%):</span>
                    <span>${quote.tax_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>${quoteDisplay.amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quote Info */}
          <Card>
            <CardHeader>
              <CardTitle>Quote Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-semibold">${quoteDisplay.amount.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Deposit Required</p>
                  <p className="font-semibold">${quoteDisplay.depositAmount.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Valid Until</p>
                  <p className="font-semibold">{quoteDisplay.validUntil}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-semibold">{quoteDisplay.createdAt}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Downloads */}
          <Card>
            <CardHeader>
              <CardTitle>Downloads</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Quote & Pay Deposit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span>Quote Total:</span>
                <span className="font-semibold">${quoteDisplay.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span>Deposit Required:</span>
                <span className="font-semibold">${quoteDisplay.depositAmount.toLocaleString()}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between items-center">
                <span>Remaining Balance:</span>
                <span className="font-semibold">${(quoteDisplay.amount - quoteDisplay.depositAmount).toLocaleString()}</span>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handlePayDeposit}>
                <CreditCard className="w-4 h-4 mr-2" />
                Pay Deposit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};