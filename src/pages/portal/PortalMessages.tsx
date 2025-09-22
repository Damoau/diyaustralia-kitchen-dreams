import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, MessageSquare, FileText, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CustomerQuoteMessages } from '@/components/portal/CustomerQuoteMessages';
import { QuoteChangeRequestDialog } from '@/components/portal/QuoteChangeRequestDialog';
import { Button } from '@/components/ui/button';

interface Quote {
  id: string;
  quote_number: string;
  status: string;
  total_amount: number;
  customer_name?: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  message_text: string;
  message_type: string;
  created_at: string;
  scope_id: string;
  topic?: string;
}

export const PortalMessages = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadQuotesAndMessages();
  }, []);

  const loadQuotesAndMessages = async () => {
    try {
      setLoading(true);

      // Load quotes for the current user
      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select('id, quote_number, status, total_amount, customer_name, created_at, updated_at')
        .order('updated_at', { ascending: false });

      if (quotesError) throw quotesError;

      // Load messages for all quotes
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('scope', 'quote')
        .in('scope_id', quotesData?.map(q => q.id) || [])
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      setQuotes(quotesData || []);
      setMessages(messagesData || []);
    } catch (error) {
      console.error('Error loading quotes and messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getMessageCount = (quoteId: string) => {
    return messages.filter(m => m.scope_id === quoteId).length;
  };

  const getLatestMessage = (quoteId: string) => {
    const quoteMessages = messages.filter(m => m.scope_id === quoteId);
    return quoteMessages[0]; // Already sorted by created_at desc
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'sent': return 'default';
      case 'accepted': return 'default';
      case 'revision_requested': return 'destructive';
      case 'expired': return 'secondary';
      default: return 'default';
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'change_request': return <MessageSquare className="w-4 h-4" />;
      case 'admin_reply': return <FileText className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const filteredQuotes = quotes.filter(quote =>
    quote.quote_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const quotesWithMessages = filteredQuotes.filter(quote => getMessageCount(quote.id) > 0);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded w-48 animate-pulse" />
          <div className="h-4 bg-muted rounded w-96 animate-pulse" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (selectedQuote) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedQuote(null)}
            className="mb-4"
          >
            ← Back to Messages
          </Button>
          <div className="flex items-center gap-4">
            <Package className="w-5 h-5" />
            <div>
              <h1 className="text-2xl font-bold">{selectedQuote.quote_number}</h1>
              <p className="text-muted-foreground">Quote Messages & Communication</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <CustomerQuoteMessages quoteId={selectedQuote.id} />
          
          <Card>
            <CardHeader>
              <CardTitle>Request Changes</CardTitle>
            </CardHeader>
            <CardContent>
              <QuoteChangeRequestDialog 
                quoteId={selectedQuote.id}
                onRequestSubmitted={() => {
                  toast({
                    title: "Request Submitted",
                    description: "Your change request has been sent to our team."
                  });
                  loadQuotesAndMessages();
                }}
              >
                <Button>Request Changes to Quote</Button>
              </QuoteChangeRequestDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <MessageSquare className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Messages</h1>
        </div>
        <p className="text-muted-foreground">
          Communicate with our team about your quotes and orders.
        </p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-4">
        {quotesWithMessages.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Messages Yet</h3>
              <p className="text-muted-foreground">
                When you communicate with our team about your quotes, messages will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          quotesWithMessages.map((quote) => {
            const messageCount = getMessageCount(quote.id);
            const latestMessage = getLatestMessage(quote.id);
            
            return (
              <Card 
                key={quote.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedQuote(quote)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">
                            {quote.quote_number}
                          </h3>
                          <Badge variant={getStatusBadgeVariant(quote.status)}>
                            {quote.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        {quote.customer_name && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {quote.customer_name}
                          </p>
                        )}
                        
                        {latestMessage && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {getMessageTypeIcon(latestMessage.message_type)}
                            <span className="truncate flex-1">
                              {latestMessage.message_text}
                            </span>
                            <span className="text-xs whitespace-nowrap">
                              {new Date(latestMessage.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {messageCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {messageCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};