import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Calendar, DollarSign, Loader2 } from "lucide-react";
import { OptimizedImage } from "@/components/performance/PerformanceOptimizer";
import { QuoteDetailSkeleton } from "@/components/ui/cart-skeleton";
import { useSlowRenderDetector } from "@/hooks/usePerformanceMonitor";
import { z } from "zod";

interface ExistingQuote {
  id: string;
  quote_number: string;
  customer_name: string | null;
  status: string;
  total_amount: number;
  created_at: string;
  valid_until: string | null;
  quote_items: Array<{ id: string }>;
}

interface QuoteSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuoteSelected: (quoteId: string | null, quoteName?: string, replaceItems?: boolean) => void;
  isLoading?: boolean;
  cartTotal?: number;
  itemCount?: number;
  onAddToCart?: () => void;
}

// Input validation schema
const quoteNameSchema = z.object({
  quoteName: z.string()
    .trim()
    .min(1, { message: "Quote name is required" })
    .max(100, { message: "Quote name must be less than 100 characters" })
    .regex(/^[a-zA-Z0-9\s\-_.,()]+$/, { 
      message: "Quote name can only contain letters, numbers, spaces, and basic punctuation" 
    })
});

export const QuoteSelectionDialog = ({ 
  open, 
  onOpenChange, 
  onQuoteSelected,
  isLoading = false,
  cartTotal = 0,
  itemCount = 0,
  onAddToCart
}: QuoteSelectionDialogProps) => {
  // Performance monitoring
  useSlowRenderDetector('QuoteSelectionDialog', 50);
  const [quotes, setQuotes] = useState<ExistingQuote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [quotesError, setQuotesError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [newQuoteName, setNewQuoteName] = useState("");
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [selectedQuoteName, setSelectedQuoteName] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchExistingQuotes();
      setNewQuoteName("");
      setSelectedQuoteId(null);
      setSelectedQuoteName(null);
      setValidationErrors({});
    }
  }, [open]);

  const fetchExistingQuotes = async () => {
    setLoadingQuotes(true);
    setQuotesError(null);
    
    try {
      console.log('🔍 Fetching existing quotes...');
      const { data: user, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('❌ Auth error:', userError);
        setIsAuthenticated(false);
        setQuotesError('Authentication error. Please log in to view existing quotes.');
        return;
      }
      
      if (!user.user) {
        console.log('❌ No authenticated user');
        setIsAuthenticated(false);
        setQuotesError('Please log in to view your existing quotes.');
        return;
      }
      
      console.log('✅ User authenticated:', user.user.id);
      setIsAuthenticated(true);

      const { data: quotesData, error } = await supabase
        .from('quotes')
        .select(`
          id,
          quote_number,
          customer_name,
          status,
          total_amount,
          created_at,
          valid_until,
          quote_items (id)
        `)
        .eq('user_id', user.user.id)
        .in('status', ['draft', 'sent', 'viewed', 'revision_requested'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }

      console.log(`✅ Found ${quotesData?.length || 0} quotes`);
      setQuotes(quotesData || []);
      
      if (!quotesData || quotesData.length === 0) {
        setQuotesError('No existing quotes found. Create your first quote above!');
      }
      
    } catch (error) {
      console.error('❌ Error fetching quotes:', error);
      setQuotesError('Failed to load existing quotes. Please try again.');
      toast({
        title: "Error",
        description: "Failed to load existing quotes",
        variant: "destructive"
      });
    } finally {
      setLoadingQuotes(false);
    }
  };

  const validateQuoteName = (name: string): boolean => {
    try {
      quoteNameSchema.parse({ quoteName: name });
      setValidationErrors(prev => ({ ...prev, quoteName: "" }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationErrors(prev => ({ 
          ...prev, 
          quoteName: error.errors[0]?.message || "Invalid quote name" 
        }));
      }
      return false;
    }
  };

  const handleCreateNew = () => {
    if (!validateQuoteName(newQuoteName)) {
      return;
    }
    
    onQuoteSelected(null, newQuoteName.trim());
  };

  const handleSelectExisting = () => {
    if (!selectedQuoteId) {
      toast({
        title: "No Quote Selected",
        description: "Please select an existing quote to update with these items",
        variant: "destructive"
      });
      return;
    }
    
    // Pass replaceItems: true to indicate we want to replace all existing items
    onQuoteSelected(selectedQuoteId, undefined, true);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: { variant: "outline" as const, text: "Draft" },
      sent: { variant: "secondary" as const, text: "Sent" },
      viewed: { variant: "default" as const, text: "Viewed" },
      revision_requested: { variant: "secondary" as const, text: "Revision Requested" }
    };
    
    const config = variants[status as keyof typeof variants] || variants.draft;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] bg-gradient-to-b from-background to-muted/20 overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            Save Items as Quote
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-1">
          <div className="space-y-6 py-4">
          {/* Create New Quote Section */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-card border border-border/50 shadow-sm">
              <div className="mb-4">
                <Label htmlFor="quote-name" className="text-base font-semibold flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary" />
                  Create New Quote
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter a name for your new quote to help you identify it later
                </p>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    id="quote-name"
                    placeholder="e.g., Kitchen Renovation - Smith House"
                    value={newQuoteName}
                    onChange={(e) => {
                      setNewQuoteName(e.target.value);
                      // Clear existing quote selection when typing in new quote name
                      if (selectedQuoteId) {
                        setSelectedQuoteId(null);
                        setSelectedQuoteName(null);
                      }
                      if (validationErrors.quoteName) {
                        validateQuoteName(e.target.value);
                      }
                    }}
                    onBlur={() => validateQuoteName(newQuoteName)}
                    className={`h-11 ${validationErrors.quoteName && !selectedQuoteId ? "border-red-500" : ""}`}
                    maxLength={100}
                  />
                  {validationErrors.quoteName && !selectedQuoteId && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.quoteName}</p>
                  )}
                </div>
                <Button 
                  onClick={handleCreateNew}
                  disabled={isLoading || !newQuoteName.trim() || !!validationErrors.quoteName}
                  className="px-6 h-11 font-semibold"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create New
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Existing Quotes Section - Always show */}
          <div className="flex items-center gap-4">
            <Separator className="flex-1" />
            <span className="text-sm text-muted-foreground">OR</span>
            <Separator className="flex-1" />
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-card border border-border/50 shadow-sm">
              <div className="mb-4">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Update Existing Quote
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Select an existing quote to replace all items with current cart items
                </p>
              </div>

              <ScrollArea className="h-64 border rounded-lg p-3 bg-muted/20">
                <div className="space-y-3">
                  {loadingQuotes ? (
                    <QuoteDetailSkeleton />
                  ) : quotesError ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                      <FileText className="w-12 h-12 text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground mb-2">{quotesError}</p>
                      {isAuthenticated === false && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.location.href = '/auth'}
                        >
                          Go to Login
                        </Button>
                      )}
                    </div>
                  ) : quotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                      <FileText className="w-12 h-12 text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground">
                        No existing quotes found. Create your first quote above!
                      </p>
                    </div>
                  ) : (
                    quotes.map((quote) => (
                      <Card 
                        key={quote.id}
                        className={`transition-all duration-200 ${
                          selectedQuoteId === quote.id 
                            ? 'ring-2 ring-primary border-primary bg-primary/5 shadow-md' 
                            : 'hover:border-primary/30 hover:shadow-lg cursor-pointer'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div 
                            className={`space-y-3 ${selectedQuoteId !== quote.id ? 'cursor-pointer' : ''}`}
                            onClick={() => {
                              if (selectedQuoteId !== quote.id) {
                                setSelectedQuoteId(quote.id);
                                setSelectedQuoteName(`${quote.quote_number} - ${quote.customer_name || 'Unnamed Quote'}`);
                                setValidationErrors({});
                                setNewQuoteName("");
                              }
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-base">{quote.quote_number}</h3>
                                  {getStatusBadge(quote.status)}
                                </div>
                                
                                <p className="text-sm font-medium text-foreground mb-2">
                                  {quote.customer_name || "Unnamed Quote"}
                                </p>
                                
                                <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(quote.created_at).toLocaleDateString()}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" />
                                    ${quote.total_amount.toLocaleString()}
                                  </div>
                                </div>
                                
                                <p className="text-xs text-muted-foreground mt-2">
                                  {quote.quote_items.length} item(s) • 
                                  {quote.valid_until 
                                    ? ` Valid until ${new Date(quote.valid_until).toLocaleDateString()}`
                                    : ' No expiry set'
                                  }
                                </p>
                              </div>
                            </div>
                            
                            {/* Action button appears within card when selected */}
                            {selectedQuoteId === quote.id && (
                              <div className="pt-3 mt-3 border-t border-primary/20">
                                <Button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectExisting();
                                  }}
                                  disabled={isLoading}
                                  className="w-full h-11 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all"
                                  size="lg"
                                >
                                  {isLoading ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Updating Quote...
                                    </>
                                  ) : (
                                    <>
                                      <FileText className="w-4 h-4 mr-2" />
                                      Update This Quote
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
              
              {/* Debug info for development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 p-2 text-xs text-muted-foreground bg-muted/50 rounded">
                  Debug: selectedQuoteId = {selectedQuoteId || 'none'} | 
                  Quotes available: {quotes.length} | 
                  Auth: {isAuthenticated ? 'yes' : 'no'}
                </div>
              )}
            </div>
          </div>

          {/* Cart Summary Section */}
          {itemCount > 0 && (
            <>
              <Separator className="my-6" />
              <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-base font-semibold">Selected Items Total:</p>
                    <p className="text-sm text-muted-foreground">{itemCount} item(s)</p>
                  </div>
                  <p className="text-2xl font-bold text-primary">${cartTotal.toLocaleString()}</p>
                </div>
                
                {onAddToCart && (
                  <Button 
                    onClick={onAddToCart}
                    className="w-full h-12 text-base"
                    size="lg"
                  >
                    Add {itemCount} Items to Cart
                  </Button>
                )}
              </div>
            </>
          )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
