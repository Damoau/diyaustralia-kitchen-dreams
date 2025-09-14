import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface RefreshImagesButtonProps {
  className?: string;
}

export function RefreshImagesButton({ className }: RefreshImagesButtonProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['cabinet-type-finishes'] });
    toast({
      title: "Images refreshed",
      description: "Cabinet images have been updated",
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      className={className}
    >
      <RefreshCw className="h-4 w-4 mr-2" />
      Refresh Images
    </Button>
  );
}