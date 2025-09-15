import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X } from 'lucide-react';

interface EditDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  onSave?: () => void;
  onCancel?: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  saveDisabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
};

export const EditDrawer = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSave,
  onCancel,
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
  saveDisabled = false,
  loading = false,
  size = 'md',
}: EditDrawerProps) => {
  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className={`w-full ${sizeClasses[size]} flex flex-col p-0`}
      >
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <SheetTitle>{title}</SheetTitle>
              {description && (
                <SheetDescription>{description}</SheetDescription>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="py-4">
            {children}
          </div>
        </ScrollArea>

        {(onSave || onCancel) && (
          <div className="border-t px-6 py-4 bg-muted/50">
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                {cancelLabel}
              </Button>
              {onSave && (
                <Button
                  onClick={onSave}
                  disabled={saveDisabled || loading}
                >
                  {loading ? 'Saving...' : saveLabel}
                </Button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};