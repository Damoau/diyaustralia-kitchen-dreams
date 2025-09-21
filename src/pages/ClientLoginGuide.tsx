import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Mail, 
  Lock, 
  Eye, 
  FileText, 
  CheckCircle, 
  ArrowRight,
  User,
  Shield,
  Download
} from 'lucide-react';

const ClientLoginGuide = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Client Quote & Portal Access Guide</h1>
        <p className="text-muted-foreground mt-2">
          Complete workflow from quote creation to client portal access
        </p>
      </div>

      {/* Email Workflow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Workflow for Clients
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">1</span>
              </div>
              <div>
                <h3 className="font-semibold">Quote Creation & Email</h3>
                <p className="text-sm text-muted-foreground">
                  When you create/update a quote and click "Send Email", the client receives:
                </p>
                <div className="mt-2 p-3 bg-gray-50 rounded border-l-4 border-blue-400">
                  <p className="font-medium">Email Subject: "Your Cabinet Quote is Ready"</p>
                  <p className="text-sm mt-1">
                    • Quote number and total amount<br/>
                    • Direct link to view quote in portal<br/>
                    • Login instructions (if new user)<br/>
                    • Valid until date
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-green-600">2</span>
              </div>
              <div>
                <h3 className="font-semibold">Client Account Creation</h3>
                <p className="text-sm text-muted-foreground">
                  If client is new, they automatically get:
                </p>
                <ul className="text-sm mt-2 space-y-1">
                  <li className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Account created with their email
                  </li>
                  <li className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Temporary password (sent in email)
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Secure access to their quotes only
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-purple-600">3</span>
              </div>
              <div>
                <h3 className="font-semibold">Portal Access</h3>
                <p className="text-sm text-muted-foreground">
                  Client clicks link and can:
                </p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Badge variant="outline">View quote details</Badge>
                  <Badge variant="outline">Download attachments</Badge>
                  <Badge variant="outline">See drawings/specs</Badge>
                  <Badge variant="outline">Approve/reject quotes</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Login Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Client Login Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Mail className="w-5 h-5 text-blue-500" />
              <div className="flex-1">
                <p className="font-medium">Step 1: Email Received</p>
                <p className="text-sm text-muted-foreground">Client receives quote notification email</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Eye className="w-5 h-5 text-green-500" />
              <div className="flex-1">
                <p className="font-medium">Step 2: Click "View Quote"</p>
                <p className="text-sm text-muted-foreground">Redirected to portal login page</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <User className="w-5 h-5 text-orange-500" />
              <div className="flex-1">
                <p className="font-medium">Step 3: Login</p>
                <p className="text-sm text-muted-foreground">
                  Enter email + password (temporary password from email if new user)
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <FileText className="w-5 h-5 text-purple-500" />
              <div className="flex-1">
                <p className="font-medium">Step 4: View Quote</p>
                <p className="text-sm text-muted-foreground">
                  Access full quote with items, drawings, and approval options
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portal Features */}
      <Card>
        <CardHeader>
          <CardTitle>What Clients Can Do in Portal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold">Quote Management</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  View detailed quote breakdown
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  See cabinet specifications
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Approve or reject quotes
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Add approval comments
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">File Access</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-500" />
                  Download drawings/plans
                </li>
                <li className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-500" />
                  View uploaded specifications
                </li>
                <li className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-500" />
                  Access quote PDFs
                </li>
                <li className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-500" />
                  See progress photos (when available)
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Testing Email */}
      <Card>
        <CardHeader>
          <CardTitle>Testing the Email Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800">To test the complete flow:</h4>
              <ol className="list-decimal list-inside space-y-2 mt-2 text-sm text-yellow-700">
                <li>Create or edit a quote in the admin dashboard</li>
                <li>Add client drawings/documents using the file upload</li>
                <li>Click "Send Email" to send the quote notification</li>
                <li>Check your email domain settings in Resend dashboard</li>
                <li>Test login with the client email address</li>
              </ol>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                View Resend Dashboard
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Test Portal Login
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientLoginGuide;