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
  onQuoteSelected: (quoteId: string | null, quoteName?: string) => void;
  isLoading?: boolean;
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
  isLoading = false 
}: QuoteSelectionDialogProps) => {
  const [quotes, setQuotes] = useState<ExistingQuote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [newQuoteName, setNewQuoteName] = useState("");
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchExistingQuotes();
      setNewQuoteName("");
      setSelectedQuoteId(null);
      setValidationErrors({});
    }
  }, [open]);

  const fetchExistingQuotes = async () => {
    setLoadingQuotes(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

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

      if (error) throw error;

      setQuotes(quotesData || []);
    } catch (error) {
      console.error('Error fetching quotes:', error);
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
        description: "Please select an existing quote to add items to",
        variant: "destructive"
      });
      return;
    }
    
    onQuoteSelected(selectedQuoteId);
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
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Save Items as Quote
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Quote Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="quote-name" className="text-base font-semibold">
                Create New Quote
              </Label>
              <p className="text-sm text-muted-foreground">
                Enter a name for your new quote to help you identify it later
              </p>
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="quote-name"
                  placeholder="e.g., Kitchen Renovation - Smith House"
                  value={newQuoteName}
                  onChange={(e) => {
                    setNewQuoteName(e.target.value);
                    if (validationErrors.quoteName) {
                      validateQuoteName(e.target.value);
                    }
                  }}
                  onBlur={() => validateQuoteName(newQuoteName)}
                  className={validationErrors.quoteName ? "border-red-500" : ""}
                  maxLength={100}
                />
                {validationErrors.quoteName && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.quoteName}</p>
                )}
              </div>
              <Button 
                onClick={handleCreateNew}
                disabled={isLoading || !newQuoteName.trim() || !!validationErrors.quoteName}
                className="px-6"
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

          {/* Existing Quotes Section */}
          {quotes.length > 0 && (
            <>
              <div className="flex items-center gap-4">
                <Separator className="flex-1" />
                <span className="text-sm text-muted-foreground">OR</span>
                <Separator className="flex-1" />
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold">
                    Add to Existing Quote
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Select an existing quote to add these items to
                  </p>
                </div>

                <ScrollArea className="h-64 border rounded-lg p-2">
                  <div className="space-y-2">
                    {loadingQuotes ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="ml-2 text-sm text-muted-foreground">Loading quotes...</span>
                      </div>
                    ) : (
                      quotes.map((quote) => (
                        <Card 
                          key={quote.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedQuoteId === quote.id 
                              ? 'ring-2 ring-primary border-primary' 
                              : ''
                          }`}
                          onClick={() => setSelectedQuoteId(quote.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-sm">{quote.quote_number}</h3>
                                  {getStatusBadge(quote.status)}
                                </div>
                                
                                <p className="text-sm font-medium text-foreground mb-1">
                                  {quote.customer_name || "Unnamed Quote"}
                                </p>
                                
                                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(quote.created_at).toLocaleDateString()}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" />
                                    ${quote.total_amount.toLocaleString()}
                                  </div>
                                </div>
                                
                                <p className="text-xs text-muted-foreground mt-1">
                                  {quote.quote_items.length} item(s) • 
                                  {quote.valid_until 
                                    ? ` Valid until ${new Date(quote.valid_until).toLocaleDateString()}`
                                    : ' No expiry set'
                                  }
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>

                <Button 
                  onClick={handleSelectExisting}
                  disabled={isLoading || !selectedQuoteId}
                  className="w-full"
                  variant="outline"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding to Quote...
                    </>
                  ) : (
                    'Add to Selected Quote'
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
