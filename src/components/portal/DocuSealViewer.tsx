import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ExternalLink, FileSignature, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DocuSealViewerProps {
  orderId: string;
}

export function DocuSealViewer({ orderId }: DocuSealViewerProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, [orderId]);

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('order_documents')
        .select('*')
        .eq('order_id', orderId)
        .eq('signing_method', 'docuseal')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading DocuSeal documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'declined':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'expired':
        return <XCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <Clock className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Signed</Badge>;
      case 'declined':
        return <Badge variant="destructive">Declined</Badge>;
      case 'expired':
        return <Badge variant="outline" className="border-orange-500 text-orange-500">Expired</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (loading) {
    return <div>Loading documents...</div>;
  }

  if (documents.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSignature className="h-5 w-5" />
          E-Signature Documents (DocuSeal)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {documents.map((doc) => (
          <div key={doc.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getStatusIcon(doc.docuseal_status)}
                  <h4 className="font-medium">{doc.title}</h4>
                  {getStatusBadge(doc.docuseal_status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {doc.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="space-y-1">
                {doc.sent_at && (
                  <p className="text-muted-foreground">
                    Sent: {formatDistanceToNow(new Date(doc.sent_at), { addSuffix: true })}
                  </p>
                )}
                {doc.docuseal_completed_at && (
                  <p className="text-muted-foreground">
                    Signed: {formatDistanceToNow(new Date(doc.docuseal_completed_at), { addSuffix: true })}
                  </p>
                )}
              </div>

              {doc.docuseal_submission_id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://docuseal.co/submissions/${doc.docuseal_submission_id}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View in DocuSeal
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
