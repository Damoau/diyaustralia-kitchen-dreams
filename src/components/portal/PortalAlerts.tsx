import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Info } from "lucide-react";

export const PortalAlerts = () => {
  // In a real app, this would come from a context or API
  const alerts = [
    {
      id: "1",
      type: "info" as const,
      message: "Your quote #QT-2024-001 is ready for review.",
      dismissible: true
    },
    {
      id: "2", 
      type: "warning" as const,
      message: "Payment for Order #ORD-2024-001 is due in 3 days.",
      dismissible: true
    }
  ];

  if (!alerts.length) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle className="w-4 h-4" />;
      case "warning": return <AlertCircle className="w-4 h-4" />;
      case "error": return <AlertCircle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getVariant = (type: string) => {
    switch (type) {
      case "error": return "destructive" as const;
      default: return "default" as const;
    }
  };

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <Alert key={alert.id} variant={getVariant(alert.type)}>
          {getIcon(alert.type)}
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
};