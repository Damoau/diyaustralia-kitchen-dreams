import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { FileSignature, ExternalLink, CheckCircle, Clock, AlertCircle, XCircle, Loader2, Download } from 'lucide-react';

interface DocuSealViewerProps {
  orderId: string;
}

export function DocuSealViewer({ orderId }: DocuSealViewerProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('docuseal-documents')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_documents',
          filter: `order_id=eq.${orderId}`,
        },
        () => {
          loadDocuments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'viewed':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      completed: 'default',
      viewed: 'secondary',
      declined: 'destructive',
      expired: 'outline',
      pending: 'outline',
      sent: 'secondary',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    );
  };

  const handleViewInDocuSeal = (submissionId: string) => {
    window.open(`https://docuseal.co/s/${submissionId}`, '_blank');
  };

  const handleDownloadSigned = async (doc: any) => {
    if (!doc.signature_url) return;

    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.signature_url);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.title}_signed.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading signed document:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
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
      <CardContent className="space-y-4">
        {documents.map((doc) => (
          <div key={doc.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium">{doc.title}</h4>
                {doc.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {doc.description}
                  </p>
                )}
              </div>
              {getStatusBadge(doc.docuseal_status || doc.status)}
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              {doc.sent_at && (
                <div>
                  <span className="font-medium">Sent:</span>{' '}
                  {new Date(doc.sent_at).toLocaleDateString()}
                </div>
              )}
              {doc.last_viewed_at && (
                <div>
                  <span className="font-medium">Last Viewed:</span>{' '}
                  {new Date(doc.last_viewed_at).toLocaleDateString()}
                </div>
              )}
              {doc.approved_at && (
                <div className="col-span-2">
                  <span className="font-medium">Completed:</span>{' '}
                  {new Date(doc.approved_at).toLocaleDateString()}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {doc.docuseal_submission_id && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleViewInDocuSeal(doc.docuseal_submission_id)}
                  className="flex-1"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View in DocuSeal
                </Button>
              )}
              
              {doc.docuseal_status === 'completed' && doc.signature_url && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleDownloadSigned(doc)}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Signed
                </Button>
              )}
            </div>

            {doc.docuseal_status === 'pending' && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-900">
                <p className="font-medium">Action Required</p>
                <p className="text-xs mt-1">
                  Check your email for the DocuSeal signing link, or click "View in DocuSeal" above.
                </p>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
