import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface ImpersonationExitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  hasUnsavedChanges: boolean;
  customerEmail: string;
}

export const ImpersonationExitDialog = ({
  open,
  onOpenChange,
  onConfirm,
  hasUnsavedChanges,
  customerEmail
}: ImpersonationExitDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            End Impersonation Session?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>You are currently impersonating <strong>{customerEmail}</strong>.</p>
            {hasUnsavedChanges ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-amber-800 font-medium">⚠️ Unsaved Changes Detected</p>
                <p className="text-amber-700 text-sm">
                  There are unsaved changes to the cart. These changes will be lost if you exit now.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800 font-medium">✓ All Changes Saved</p>
                <p className="text-green-700 text-sm">
                  All cart changes have been saved successfully.
                </p>
              </div>
            )}
            <p>Are you sure you want to return to admin mode?</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Stay in Session</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={hasUnsavedChanges ? "bg-amber-600 hover:bg-amber-700" : ""}
          >
            {hasUnsavedChanges ? "Exit Anyway" : "Return to Admin"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};