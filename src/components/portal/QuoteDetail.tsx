import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  FileText, 
  Download, 
  DollarSign, 
  Calendar,
  MessageSquare,
  CheckCircle,
  CreditCard,
  Upload
} from "lucide-react";

interface QuoteDetailProps {
  quoteId: string;
}

export const QuoteDetail = ({ quoteId }: QuoteDetailProps) => {
  const [selectedVersion, setSelectedVersion] = useState(2);
  const [changeRequest, setChangeRequest] = useState("");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // Mock data - in real app this would come from API
  const quote = {
    id: quoteId,
    label: "Kitchen Renovation",
    status: "pending_approval",
    amount: 12500,
    depositAmount: 2500,
    validUntil: "2024-02-15",
    createdAt: "2024-01-15",
    currentVersion: 2,
    versions: [
      {
        version: 1,
        amount: 11800,
        items: [
          { name: "Base Cabinets", qty: 8, price: 6400 },
          { name: "Wall Cabinets", qty: 6, price: 3600 },
          { name: "Pantry Cabinet", qty: 1, price: 1800 }
        ],
        createdAt: "2024-01-10"
      },
      {
        version: 2,
        amount: 12500,
        items: [
          { name: "Base Cabinets", qty: 8, price: 6400 },
          { name: "Wall Cabinets", qty: 7, price: 4200 },
          { name: "Pantry Cabinet", qty: 1, price: 1900 }
        ],
        createdAt: "2024-01-15"
      }
    ]
  };

  const currentVersionData = quote.versions.find(v => v.version === selectedVersion);

  const getStatusBadge = (status: string) => {
    const variants = {
      pending_approval: { variant: "secondary" as const, text: "Pending Approval" },
      draft: { variant: "outline" as const, text: "Draft" },
      accepted: { variant: "default" as const, text: "Accepted" },
      expired: { variant: "destructive" as const, text: "Expired" }
    };
    
    const config = variants[status as keyof typeof variants] || variants.draft;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const handleAcceptQuote = () => {
    setShowPaymentDialog(true);
  };

  const handlePayDeposit = () => {
    // In real app, this would integrate with Stripe
    console.log("Processing deposit payment:", quote.depositAmount);
    setShowPaymentDialog(false);
  };

  const handleRequestChange = () => {
    // In real app, this would create a new version
    console.log("Change request:", changeRequest);
    setChangeRequest("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{quote.id}</h1>
          <p className="text-muted-foreground mt-2">{quote.label}</p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(quote.status)}
          <Badge variant="outline">v{quote.currentVersion}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Version Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Quote Versions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {quote.versions.map((version) => (
                  <Button
                    key={version.version}
                    variant={selectedVersion === version.version ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedVersion(version.version)}
                  >
                    Version {version.version} (${version.amount.toLocaleString()})
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quote Items */}
          <Card>
            <CardHeader>
              <CardTitle>Quote Items - Version {selectedVersion}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentVersionData?.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">Quantity: {item.qty}</p>
                    </div>
                    <p className="font-semibold">${item.price.toLocaleString()}</p>
                  </div>
                ))}
                
                <Separator />
                
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${currentVersionData?.amount.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {quote.status === "pending_approval" && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button onClick={handleAcceptQuote} className="w-full">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept Quote
                  </Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Request Changes
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Request Changes</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Textarea
                          placeholder="Describe the changes you'd like to request..."
                          value={changeRequest}
                          onChange={(e) => setChangeRequest(e.target.value)}
                          rows={4}
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setChangeRequest("")}>
                            Cancel
                          </Button>
                          <Button onClick={handleRequestChange} disabled={!changeRequest.trim()}>
                            <Upload className="w-4 h-4 mr-2" />
                            Submit Request
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quote Info */}
          <Card>
            <CardHeader>
              <CardTitle>Quote Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-semibold">${quote.amount.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Deposit Required</p>
                  <p className="font-semibold">${quote.depositAmount.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Valid Until</p>
                  <p className="font-semibold">{quote.validUntil}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-semibold">{quote.createdAt}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Downloads */}
          <Card>
            <CardHeader>
              <CardTitle>Downloads</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Quote & Pay Deposit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span>Quote Total:</span>
                <span className="font-semibold">${quote.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span>Deposit Required:</span>
                <span className="font-semibold">${quote.depositAmount.toLocaleString()}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between items-center">
                <span>Remaining Balance:</span>
                <span className="font-semibold">${(quote.amount - quote.depositAmount).toLocaleString()}</span>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handlePayDeposit}>
                <CreditCard className="w-4 h-4 mr-2" />
                Pay Deposit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};