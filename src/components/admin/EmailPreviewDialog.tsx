import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { FileText, Paperclip, X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface EmailPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: any;
  onSendEmail: (emailData: {
    subject: string;
    content: string;
    template: string;
    attachments: Array<{ id: string; name: string; url: string }>;
  }) => Promise<void>;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
}

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  url: string;
  type: string;
}

const defaultTemplates: EmailTemplate[] = [
  {
    id: 'quote_created',
    name: 'New Quote - Standard',
    subject: 'Your Kitchen Quote {{quote_number}} - {{total_amount}}',
    content: `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Your Kitchen Quote</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 600;">Your Kitchen Quote is Ready!</h1>
        <p style="margin: 10px 0 0; opacity: 0.9; font-size: 16px;">Quote {{quote_number}}</p>
      </div>
      
      <div style="padding: 40px 30px;">
        <p style="margin: 0 0 20px; font-size: 16px;">Hi {{customer_name}},</p>
        
        <p style="margin: 0 0 20px; font-size: 16px;">Thank you for your interest in our kitchen cabinets! We've prepared a custom quote for you:</p>
        
        <div style="background: #f8f9fa; padding: 25px; border-radius: 6px; margin: 25px 0; border-left: 4px solid #667eea;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <span style="font-weight: 600; color: #667eea;">Quote Number:</span>
            <span style="font-weight: 600;">{{quote_number}}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 600; color: #667eea;">Total Amount:</span>
            <span style="font-size: 18px; font-weight: 700; color: #2d3748;">{{total_amount}}</span>
          </div>
        </div>

        <div style="text-align: center; margin: 35px 0;">
          <a href="{{portal_url}}" style="display: inline-block; background: #667eea; color: white; text-decoration: none; padding: 15px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">View Your Quote</a>
        </div>

        <p style="margin: 30px 0 0; font-size: 14px; color: #64748b;">If you have any questions about your quote, please don't hesitate to contact us.</p>
        
        <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #64748b;">Best regards,<br><strong>Sydney Trade Machines Team</strong></p>
        </div>
      </div>
    </div>
  </body>
</html>`,
    variables: ['customer_name', 'quote_number', 'total_amount', 'portal_url']
  },
  {
    id: 'quote_premium',
    name: 'Premium Quote Template',
    subject: 'Premium Kitchen Quote {{quote_number}} - Exclusive Design',
    content: `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Premium Kitchen Quote</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);">
    <div style="max-width: 650px; margin: 40px auto; background: white; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.15); overflow: hidden;">
      <div style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 50px 40px; text-align: center;">
        <div style="background: rgba(255,255,255,0.1); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 32px;">✨</span>
        </div>
        <h1 style="margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -1px;">Premium Kitchen Design</h1>
        <p style="margin: 15px 0 0; opacity: 0.9; font-size: 18px;">Exclusive Quote {{quote_number}}</p>
      </div>
      
      <div style="padding: 50px 40px;">
        <p style="margin: 0 0 25px; font-size: 18px; font-weight: 500;">Dear {{customer_name}},</p>
        
        <p style="margin: 0 0 25px; font-size: 16px; line-height: 1.7;">We're excited to present your exclusive premium kitchen design. Our expert team has crafted a bespoke solution tailored to your unique requirements:</p>
        
        <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 35px; border-radius: 12px; margin: 35px 0; position: relative; overflow: hidden;">
          <div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: linear-gradient(90deg, #1e3c72, #2a5298);"></div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <span style="font-weight: 600; color: #1e3c72; font-size: 16px;">Quote Reference:</span>
            <span style="font-weight: 700; font-size: 16px;">{{quote_number}}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 600; color: #1e3c72; font-size: 16px;">Investment Total:</span>
            <span style="font-size: 24px; font-weight: 800; color: #1e3c72;">{{total_amount}}</span>
          </div>
        </div>

        <div style="text-align: center; margin: 45px 0;">
          <a href="{{portal_url}}" style="display: inline-block; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; text-decoration: none; padding: 18px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 20px rgba(30, 60, 114, 0.3); transition: all 0.3s ease;">Explore Your Premium Design</a>
        </div>

        <div style="background: #fff8e1; padding: 25px; border-radius: 8px; margin: 35px 0; border-left: 4px solid #ff8f00;">
          <p style="margin: 0 0 15px; font-weight: 600; color: #e65100;">Premium Service Includes:</p>
          <ul style="margin: 0; padding-left: 20px; color: #bf360c; line-height: 1.8;">
            <li>Dedicated project manager</li>
            <li>3D design visualization</li>
            <li>Premium hardware selection</li>
            <li>White-glove installation service</li>
          </ul>
        </div>

        <p style="margin: 40px 0 0; font-size: 16px; color: #64748b; text-align: center; font-style: italic;">Your premium kitchen journey begins with a single click.</p>
        
        <div style="margin-top: 50px; padding-top: 30px; border-top: 2px solid #e2e8f0; text-align: center;">
          <p style="margin: 0; font-size: 16px; color: #64748b;">With premium regards,<br><strong style="color: #1e3c72;">Sydney Trade Machines Premium Team</strong></p>
        </div>
      </div>
    </div>
  </body>
</html>`,
    variables: ['customer_name', 'quote_number', 'total_amount', 'portal_url']
  }
];

export const EmailPreviewDialog: React.FC<EmailPreviewDialogProps> = ({
  open,
  onOpenChange,
  quote,
  onSendEmail
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>(defaultTemplates[0]);
  const [customSubject, setCustomSubject] = useState('');
  const [customContent, setCustomContent] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (open && quote) {
      setCustomSubject(replaceVariables(selectedTemplate.subject, quote));
      setCustomContent(replaceVariables(selectedTemplate.content, quote));
    }
  }, [open, selectedTemplate, quote]);

  const replaceVariables = (text: string, quoteData: any) => {
    return text
      .replace(/{{customer_name}}/g, quoteData?.customer_name || 'Customer')
      .replace(/{{quote_number}}/g, quoteData?.quote_number || 'QT-0000')
      .replace(/{{total_amount}}/g, new Intl.NumberFormat('en-AU', { 
        style: 'currency', 
        currency: 'AUD' 
      }).format(quoteData?.total_amount || 0))
      .replace(/{{portal_url}}/g, `https://ebf0769f-8814-47f0-bfb6-515c0f9cba2c.lovableproject.com/portal/quotes/${quoteData?.id}`);
  };

  const handleTemplateChange = (templateId: string) => {
    const template = defaultTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsUploading(true);
    
    try {
      for (const file of Array.from(files)) {
        // Upload to Supabase storage
        const fileName = `${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from('documents')
          .upload(`email-attachments/${fileName}`, file);

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(data.path);

        // Create file record
        const { data: fileRecord, error: fileError } = await supabase
          .from('files')
          .insert({
            filename: file.name,
            file_size: file.size,
            mime_type: file.type,
            storage_url: urlData.publicUrl,
            kind: 'email_attachment'
          })
          .select()
          .single();

        if (fileError) throw fileError;

        setAttachments(prev => [...prev, {
          id: fileRecord.id,
          name: file.name,
          size: file.size,
          url: urlData.publicUrl,
          type: file.type
        }]);
      }

      toast.success('Files uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(a => a.id !== attachmentId));
  };

  const handleSend = async () => {
    try {
      await onSendEmail({
        subject: customSubject,
        content: customContent,
        template: selectedTemplate.id,
        attachments: attachments
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Send error:', error);
      toast.error('Failed to send email');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Email Preview & Send</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="compose" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="compose">Compose</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="attachments">Attachments</TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="flex-1 space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="template">Email Template</Label>
                <select 
                  id="template"
                  className="w-full mt-1 p-2 border rounded-md"
                  value={selectedTemplate.id}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                >
                  {defaultTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                />
              </div>

              <div className="flex-1">
                <Label htmlFor="content">Email Content</Label>
                <Textarea
                  id="content"
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>

              <div className="text-sm text-muted-foreground">
                <p><strong>Available variables:</strong></p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedTemplate.variables.map(variable => (
                    <Badge key={variable} variant="outline">
                      {`{{${variable}}}`}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="flex-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-sm">Email Preview</CardTitle>
                <div className="text-sm text-muted-foreground">
                  <strong>To:</strong> {quote?.customer_email}<br/>
                  <strong>Subject:</strong> {customSubject}
                </div>
              </CardHeader>
              <CardContent>
                <div 
                  className="border rounded-lg p-4 bg-white max-h-[400px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: customContent }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attachments" className="flex-1 space-y-4">
            <div>
              <Label htmlFor="file-upload">Upload Attachments</Label>
              <div className="mt-2">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PDF, DOC, Images (MAX. 10MB each)</p>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2">
                <Label>Attached Files</Label>
                {attachments.map(attachment => (
                  <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">{attachment.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(attachment.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Separator />
        
        <div className="flex justify-between items-center pt-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Paperclip className="w-4 h-4" />
            <span>{attachments.length} attachment{attachments.length !== 1 ? 's' : ''}</span>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSend}>
              Send Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};