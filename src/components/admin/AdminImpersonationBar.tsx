import { useAdminImpersonation } from "@/contexts/AdminImpersonationContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, UserCheck, X, ArrowLeft } from "lucide-react";

export const AdminImpersonationBar = () => {
  const { 
    isImpersonating, 
    impersonatedCustomerEmail, 
    currentQuoteId, 
    endImpersonation 
  } = useAdminImpersonation();

  if (!isImpersonating) return null;

  const handleEndImpersonation = async () => {
    await endImpersonation();
    // Redirect back to admin
    window.location.href = '/admin/sales/quotes';
  };

  return (
    <Card className="fixed top-0 left-0 right-0 z-50 rounded-none border-l-0 border-r-0 border-t-0 bg-orange-50 border-orange-200">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
              Admin Mode
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <UserCheck className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Impersonating:</span>
            <span className="font-medium">{impersonatedCustomerEmail}</span>
          </div>
          
          {currentQuoteId && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">Quote:</span>
              <Badge variant="secondary">{currentQuoteId.slice(0, 8)}...</Badge>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEndImpersonation}
            className="text-orange-700 border-orange-300 hover:bg-orange-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Admin
          </Button>
        </div>
      </div>
    </Card>
  );
};