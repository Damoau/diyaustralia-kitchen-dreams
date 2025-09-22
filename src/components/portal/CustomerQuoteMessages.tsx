import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  message_text: string;
  message_type: string;
  created_at: string;
  user_id: string;
  scope: string;
  scope_id: string;
  topic?: string;
  extension?: string;
}

interface CustomerQuoteMessagesProps {
  quoteId: string;
  className?: string;
}

export const CustomerQuoteMessages = ({ quoteId, className }: CustomerQuoteMessagesProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, [quoteId]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          message_text,
          message_type,
          created_at,
          user_id,
          scope,
          scope_id,
          topic,
          extension
        `)
        .eq('scope', 'quote')
        .eq('scope_id', quoteId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Database error loading messages:', error);
        throw error;
      }
      
      console.log('Customer loaded messages:', data);
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const getMessageTypeLabel = (messageType: string) => {
    switch (messageType) {
      case 'change_request':
        return 'Change Request';
      case 'customer_message':
        return 'Your Message';
      case 'admin_reply':
        return 'Staff Reply';
      default:
        return 'Message';
    }
  };

  const getMessageTypeVariant = (messageType: string) => {
    switch (messageType) {
      case 'change_request':
        return 'destructive' as const;
      case 'admin_reply':
        return 'default' as const;
      default:
        return 'secondary' as const;
    }
  };

  const isCustomerMessage = (messageType: string) => {
    return messageType === 'customer_message' || messageType === 'change_request';
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Messages & Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading messages...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (messages.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Messages & Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No messages for this quote yet.</p>
            <p className="text-sm mt-1">You can request changes using the "Request Changes" button above.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Messages & Updates
          <Badge variant="secondary">{messages.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`p-4 rounded-lg border ${
                isCustomerMessage(message.message_type)
                  ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800' 
                  : 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span className="font-medium">
                      {isCustomerMessage(message.message_type) ? 'You' : 'DIY Kitchens Staff'}
                    </span>
                  </div>
                  <Badge variant={getMessageTypeVariant(message.message_type)}>
                    {getMessageTypeLabel(message.message_type)}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                </div>
              </div>
              <p className="text-sm whitespace-pre-wrap">{message.message_text}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};