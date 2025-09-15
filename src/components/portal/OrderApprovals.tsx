import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Clock, AlertCircle, FileSignature } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CustomerApproval {
  id: string;
  order_id: string;
  final_measurements_confirmed: boolean;
  style_colour_finish_confirmed: boolean;
  final_measurements_confirmed_at: string | null;
  style_colour_finish_confirmed_at: string | null;
  signature_required: boolean;
  signature_completed_at: string | null;
  all_approvals_completed_at: string | null;
  notes: string;
}

interface OrderApprovalsProps {
  orderId: string;
  approvals: CustomerApproval | null;
  onUpdate: () => void;
}

export function OrderApprovals({ orderId, approvals, onUpdate }: OrderApprovalsProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = React.useState(false);

  const updateApproval = async (field: string, value: boolean) => {
    if (!approvals) return;
    
    setIsUpdating(true);
    
    try {
      const updateData: any = {
        [field]: value,
        [`${field}_at`]: value ? new Date().toISOString() : null,
        [`${field}_by`]: value ? (await supabase.auth.getUser()).data.user?.id : null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('customer_approvals')
        .update(updateData)
        .eq('id', approvals.id);

      if (error) throw error;

      toast({
        title: "Approval Updated",
        description: `${field.replace(/_/g, ' ')} has been ${value ? 'confirmed' : 'reset'}.`,
      });
      
      onUpdate();
    } catch (error: any) {
      console.error('Error updating approval:', error);
      toast({
        title: "Error",
        description: "Failed to update approval. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getApprovalStatus = () => {
    if (!approvals) return { status: 'pending', label: 'Pending Setup', variant: 'secondary' as const };
    
    if (approvals.all_approvals_completed_at) {
      return { status: 'completed', label: 'All Approved', variant: 'default' as const };
    }
    
    if (approvals.final_measurements_confirmed || approvals.style_colour_finish_confirmed) {
      return { status: 'partial', label: 'Partially Approved', variant: 'outline' as const };
    }
    
    return { status: 'pending', label: 'Awaiting Approval', variant: 'secondary' as const };
  };

  const approvalStatus = getApprovalStatus();
  const allApproved = approvals?.all_approvals_completed_at;

  if (!approvals) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Customer Approvals
          </CardTitle>
          <CardDescription>
            Approvals are being set up for this order.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {allApproved ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-600" />
            )}
            Customer Approvals
          </div>
          <Badge variant={approvalStatus.variant}>
            {approvalStatus.label}
          </Badge>
        </CardTitle>
        <CardDescription>
          Production cannot begin until all required approvals are confirmed.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {allApproved && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              All approvals completed on {new Date(allApproved).toLocaleDateString()}. 
              Production can now proceed.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex items-start space-x-3 p-4 border rounded-lg">
            <Checkbox
              id="measurements"
              checked={approvals.final_measurements_confirmed}
              onCheckedChange={(checked) => 
                updateApproval('final_measurements_confirmed', !!checked)
              }
              disabled={isUpdating}
            />
            <div className="flex-1 space-y-1">
              <label 
                htmlFor="measurements" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Final Measurements Confirmed
              </label>
              <p className="text-xs text-muted-foreground">
                I confirm that the final measurements are accurate and I approve them for production.
              </p>
              {approvals.final_measurements_confirmed_at && (
                <p className="text-xs text-green-600">
                  Confirmed on {new Date(approvals.final_measurements_confirmed_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 border rounded-lg">
            <Checkbox
              id="style"
              checked={approvals.style_colour_finish_confirmed}
              onCheckedChange={(checked) => 
                updateApproval('style_colour_finish_confirmed', !!checked)
              }
              disabled={isUpdating}
            />
            <div className="flex-1 space-y-1">
              <label 
                htmlFor="style" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Door Style, Colour & Finish Confirmed
              </label>
              <p className="text-xs text-muted-foreground">
                I confirm the door style, colour, and finish selections are correct and approve them for production.
              </p>
              {approvals.style_colour_finish_confirmed_at && (
                <p className="text-xs text-green-600">
                  Confirmed on {new Date(approvals.style_colour_finish_confirmed_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {approvals.signature_required && (
            <>
              <Separator />
              <div className="flex items-start space-x-3 p-4 border rounded-lg bg-muted/30">
                <FileSignature className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div className="flex-1 space-y-2">
                  <h4 className="text-sm font-medium">Digital Signature</h4>
                  <p className="text-xs text-muted-foreground">
                    A digital signature will be required before production begins.
                  </p>
                  {approvals.signature_completed_at ? (
                    <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                      Signed on {new Date(approvals.signature_completed_at).toLocaleDateString()}
                    </Badge>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      Sign Document (Coming Soon)
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {approvals.notes && (
          <>
            <Separator />
            <div className="text-sm">
              <h4 className="font-medium mb-2">Notes</h4>
              <p className="text-muted-foreground">{approvals.notes}</p>
            </div>
          </>
        )}

        {!allApproved && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please review all items carefully before confirming. Once all approvals are completed, 
              your order will proceed to production and changes may not be possible.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}