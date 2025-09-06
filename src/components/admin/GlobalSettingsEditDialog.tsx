import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface GlobalSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  description: string;
}

interface GlobalSettingsEditDialogProps {
  setting: GlobalSetting | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (setting: Partial<GlobalSetting>) => void;
}

const GlobalSettingsEditDialog = ({ setting, open, onOpenChange, onSave }: GlobalSettingsEditDialogProps) => {
  const [formData, setFormData] = useState({
    setting_key: "",
    setting_value: "",
    description: ""
  });

  useEffect(() => {
    if (setting) {
      setFormData({
        setting_key: setting.setting_key,
        setting_value: setting.setting_value,
        description: setting.description || ""
      });
    } else {
      setFormData({
        setting_key: "",
        setting_value: "",
        description: ""
      });
    }
  }, [setting]);

  const handleSave = () => {
    onSave({
      id: setting?.id,
      ...formData
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{setting ? 'Edit Global Setting' : 'Add New Global Setting'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="setting_key">Setting Key</Label>
            <Input
              id="setting_key"
              value={formData.setting_key}
              onChange={(e) => setFormData({...formData, setting_key: e.target.value})}
              placeholder="e.g., hmr_rate_per_sqm"
              disabled={!!setting?.id} // Don't allow editing key for existing settings
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="setting_value">Setting Value</Label>
            <Input
              id="setting_value"
              value={formData.setting_value}
              onChange={(e) => setFormData({...formData, setting_value: e.target.value})}
              placeholder="e.g., 85.00"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Description of this setting"
              rows={3}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSettingsEditDialog;