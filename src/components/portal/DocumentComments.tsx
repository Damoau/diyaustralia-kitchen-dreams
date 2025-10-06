import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, Loader2, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DocumentCommentsProps {
  documentId: string;
  orderId: string;
}

interface Comment {
  id: string;
  document_id: string;
  user_id: string;
  comment_text: string;
  comment_type: 'note' | 'change_request' | 'approval';
  created_at: string;
  profiles?: {
    display_name?: string;
    email?: string;
  };
}

export function DocumentComments({ documentId, orderId }: DocumentCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<'note' | 'change_request' | 'approval'>('note');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadComments();

    // Subscribe to new comments
    const channel = supabase
      .channel(`document-comments-${documentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'document_comments',
          filter: `document_id=eq.${documentId}`
        },
        () => {
          loadComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [documentId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('document_comments' as any)
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map data to Comment type
      const mappedComments: Comment[] = (data || []).map((item: any) => ({
        id: item.id,
        document_id: item.document_id,
        user_id: item.user_id,
        comment_text: item.comment_text,
        comment_type: item.comment_type as 'note' | 'change_request' | 'approval',
        created_at: item.created_at
      }));
      
      setComments(mappedComments);
    } catch (error: any) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      toast({
        title: 'Comment required',
        description: 'Please enter a comment',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('document_comments' as any)
        .insert({
          document_id: documentId,
          order_id: orderId,
          user_id: userData.user?.id || '',
          comment_text: newComment,
          comment_type: commentType,
        });

      if (error) throw error;

      toast({
        title: 'Comment added',
        description: 'Your comment has been submitted',
      });

      setNewComment('');
      loadComments();
    } catch (error: any) {
      toast({
        title: 'Failed to add comment',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getCommentTypeBadge = (type: string) => {
    switch (type) {
      case 'change_request':
        return <Badge variant="destructive">Change Request</Badge>;
      case 'approval':
        return <Badge className="bg-green-500">Approval</Badge>;
      default:
        return <Badge variant="secondary">Note</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments & Notes
        </CardTitle>
        <CardDescription>
          Add notes, request changes, or approve the document
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Comment Form */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant={commentType === 'note' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCommentType('note')}
            >
              Note
            </Button>
            <Button
              variant={commentType === 'change_request' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCommentType('change_request')}
            >
              Request Change
            </Button>
            <Button
              variant={commentType === 'approval' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCommentType('approval')}
            >
              Approve
            </Button>
          </div>

          <Textarea
            placeholder={
              commentType === 'change_request'
                ? 'Describe the changes you would like...'
                : commentType === 'approval'
                ? 'Add approval notes (optional)...'
                : 'Add your notes or comments...'
            }
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />

          <Button
            onClick={handleSubmitComment}
            disabled={submitting || !newComment.trim()}
            className="w-full"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Add Comment
              </>
            )}
          </Button>
        </div>

        {/* Comments List */}
        <div className="space-y-3 border-t pt-4">
          <h4 className="font-medium text-sm">Previous Comments</h4>
          
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No comments yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">
                        {comment.profiles?.display_name || comment.profiles?.email || 'User'}
                      </span>
                      {getCommentTypeBadge(comment.comment_type)}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {comment.comment_text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
