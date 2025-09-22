import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Clock, User, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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

interface QuoteMessagesProps {
  quoteId: string;
  quoteNumber: string;
}

export const QuoteMessages = ({ quoteId, quoteNumber }: QuoteMessagesProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

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
      
      console.log('Loaded messages:', data);
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendReply = async () => {
    if (!replyMessage.trim()) return;

    setSending(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('messages')
        .insert({
          scope: 'quote',
          scope_id: quoteId,
          message_text: replyMessage.trim(),
          message_type: 'admin_reply',
          user_id: user.user.id,
          topic: `Reply to quote ${quoteNumber}`,
          extension: 'admin'
        });

      if (error) throw error;

      toast({
        title: "Reply Sent",
        description: "Your reply has been sent to the customer."
      });

      setReplyMessage('');
      loadMessages(); // Refresh messages
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const getMessageTypeLabel = (messageType: string) => {
    switch (messageType) {
      case 'change_request':
        return 'Change Request';
      case 'customer_message':
        return 'Customer Message';
      case 'admin_reply':
        return 'Admin Reply';
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Messages & Change Requests
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Messages & Change Requests
          {messages.length > 0 && (
            <Badge variant="secondary">{messages.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No messages or change requests for this quote yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-4 rounded-lg border ${
                  isCustomerMessage(message.message_type)
                    ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800' 
                    : 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span className="font-medium">
                        {isCustomerMessage(message.message_type) ? 'Customer' : 'Admin'}
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
        )}

        <Separator />

        {/* Reply Section */}
        <div className="space-y-3">
          <h4 className="font-medium">Send Reply</h4>
          <Textarea
            placeholder="Type your reply to the customer..."
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end">
            <Button
              onClick={sendReply}
              disabled={!replyMessage.trim() || sending}
              size="sm"
            >
              <Send className="w-4 h-4 mr-2" />
              {sending ? 'Sending...' : 'Send Reply'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};