import { useAdminImpersonation } from "@/contexts/AdminImpersonationContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, UserCheck, X, ArrowLeft, Save, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { ImpersonationExitDialog } from "./ImpersonationExitDialog";
import { useState } from "react";

export const AdminImpersonationBar = () => {
  const { 
    isImpersonating, 
    impersonatedCustomerEmail, 
    currentQuoteId, 
    cartHasUnsavedChanges,
    saveStatus,
    endImpersonation 
  } = useAdminImpersonation();
  
  const [showExitDialog, setShowExitDialog] = useState(false);

  if (!isImpersonating) return null;

  const handleEndImpersonation = async () => {
    const success = await endImpersonation(false);
    if (!success && cartHasUnsavedChanges) {
      setShowExitDialog(true);
    } else if (success) {
      // Redirect back to admin
      window.location.href = '/admin/sales/quotes';
    }
  };

  const handleForceExit = async () => {
    await endImpersonation(true);
    setShowExitDialog(false);
    window.location.href = '/admin/sales/quotes';
  };

  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
      case 'saved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Save className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'All changes saved';
      case 'error':
        return 'Save failed';
      default:
        return cartHasUnsavedChanges ? 'Unsaved changes' : 'Up to date';
    }
  };

  return (
    <>
      {/* Top spacer for fixed banner */}
      <div className="h-16" />
      
      {/* Fixed bottom banner */}
      <Card className="fixed bottom-0 left-0 right-0 z-50 rounded-none border-l-0 border-r-0 border-b-0 bg-gradient-to-r from-orange-100 to-amber-100 border-t-2 border-orange-300 shadow-lg">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            {/* Impersonation status */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
                <Badge variant="outline" className="bg-orange-200 text-orange-900 border-orange-400 font-semibold">
                  ADMIN IMPERSONATION ACTIVE
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <UserCheck className="w-4 h-4 text-orange-700" />
                <span className="text-orange-700 font-medium">Acting as:</span>
                <span className="font-bold text-orange-900">{impersonatedCustomerEmail}</span>
              </div>
            </div>

            {/* Quote info */}
            {currentQuoteId && (
              <div className="flex items-center gap-2 text-sm border-l border-orange-300 pl-4">
                <span className="text-orange-700">Quote ID:</span>
                <Badge variant="secondary" className="bg-orange-200 text-orange-900">
                  {currentQuoteId.slice(0, 8)}...
                </Badge>
              </div>
            )}

            {/* Save status */}
            <div className="flex items-center gap-2 text-sm border-l border-orange-300 pl-4">
              {getSaveStatusIcon()}
              <span className={`font-medium ${
                saveStatus === 'error' ? 'text-red-700' :
                saveStatus === 'saved' ? 'text-green-700' :
                cartHasUnsavedChanges ? 'text-amber-700' : 'text-orange-700'
              }`}>
                {getSaveStatusText()}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEndImpersonation}
              className="text-orange-800 border-orange-400 hover:bg-orange-200 font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Admin
            </Button>
          </div>
        </div>
      </Card>

      {/* Exit confirmation dialog */}
      <ImpersonationExitDialog
        open={showExitDialog}
        onOpenChange={setShowExitDialog}
        onConfirm={handleForceExit}
        hasUnsavedChanges={cartHasUnsavedChanges}
        customerEmail={impersonatedCustomerEmail || ''}
      />
    </>
  );
};