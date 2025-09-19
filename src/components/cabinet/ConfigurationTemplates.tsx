import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Save, Trash2, Download, Upload, Star, Layout } from 'lucide-react';
import { CabinetType } from '@/types/cabinet';
import { CabinetConfigurationService, ConfigurationTemplate, CabinetConfiguration } from '@/services/CabinetConfigurationService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface ConfigurationTemplatesProps {
  cabinetType: CabinetType;
  currentConfiguration: CabinetConfiguration | null;
  onTemplateApply: (configuration: CabinetConfiguration) => void;
  onConfigurationSave: (configuration: CabinetConfiguration) => void;
}

export function ConfigurationTemplates({
  cabinetType,
  currentConfiguration,
  onTemplateApply,
  onConfigurationSave
}: ConfigurationTemplatesProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<ConfigurationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, [cabinetType.id, user?.id]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const loadedTemplates = await CabinetConfigurationService.loadTemplates(
        cabinetType.id,
        user?.id
      );
      setTemplates(loadedTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Error",
        description: "Failed to load configuration templates",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleSaveTemplate = async () => {
    if (!currentConfiguration || !newTemplateName.trim()) {
      toast({
        title: "Error",
        description: "Please provide a template name",
        variant: "destructive",
      });
      return;
    }

    try {
      const template = await CabinetConfigurationService.saveTemplate({
        name: newTemplateName,
        description: newTemplateDescription || undefined,
        cabinetTypeId: cabinetType.id,
        configuration: currentConfiguration,
        userId: user?.id
      });

      if (template) {
        setTemplates(prev => [template, ...prev]);
        setNewTemplateName('');
        setNewTemplateDescription('');
        setShowSaveDialog(false);
        
        toast({
          title: "Success",
          description: "Template saved successfully",
        });
      } else {
        throw new Error('Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const success = await CabinetConfigurationService.deleteTemplate(templateId);
      
      if (success) {
        setTemplates(prev => prev.filter(t => t.id !== templateId));
        toast({
          title: "Success",
          description: "Template deleted successfully",
        });
      } else {
        throw new Error('Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const handleApplyTemplate = (template: ConfigurationTemplate) => {
    const configWithUpdatedTimestamp = {
      ...template.configuration,
      updatedAt: new Date()
    };
    
    onTemplateApply(configWithUpdatedTimestamp);
    
    toast({
      title: "Template Applied",
      description: `Configuration "${template.name}" has been applied`,
    });
  };

  const exportTemplates = () => {
    const dataStr = JSON.stringify(templates, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `cabinet-templates-${cabinetType.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const formatDimensions = (config: CabinetConfiguration) => {
    if (cabinetType.cabinet_style === 'corner') {
      return `L: ${config.leftSideWidth}×${config.height}×${config.leftSideDepth}mm, R: ${config.rightSideWidth}×${config.height}×${config.rightSideDepth}mm`;
    }
    return `${config.width}×${config.height}×${config.depth}mm`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Configuration Templates</h3>
          <p className="text-sm text-muted-foreground">
            Save and reuse cabinet configurations
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportTemplates}
            disabled={templates.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                disabled={!currentConfiguration}
              >
                <Plus className="h-4 w-4 mr-2" />
                Save Current
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Configuration Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="My Custom Configuration"
                  />
                </div>
                <div>
                  <Label htmlFor="template-description">Description (Optional)</Label>
                  <Textarea
                    id="template-description"
                    value={newTemplateDescription}
                    onChange={(e) => setNewTemplateDescription(e.target.value)}
                    placeholder="Description of this configuration..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowSaveDialog(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleSaveTemplate} className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    Save Template
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Separator />

      {/* Templates List */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Layout className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Templates Yet</h3>
            <p className="text-muted-foreground mb-4">
              Save your first configuration template to get started
            </p>
            <Button 
              onClick={() => setShowSaveDialog(true)}
              disabled={!currentConfiguration}
            >
              <Plus className="h-4 w-4 mr-2" />
              Save Current Configuration
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => (
            <Card key={template.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {template.name}
                      {template.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </CardTitle>
                    {template.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {template.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="text-destructive hover:text-destructive h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Dimensions:</span>{' '}
                    <span className="text-muted-foreground">
                      {formatDimensions(template.configuration)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Quantity:</span>{' '}
                    <span className="text-muted-foreground">
                      {template.configuration.quantity}
                    </span>
                  </div>
                  {template.configuration.doorStyleId && (
                    <div>
                      <span className="font-medium">Style:</span>{' '}
                      <Badge variant="outline" className="text-xs">
                        Door Style
                      </Badge>
                    </div>
                  )}
                  {template.configuration.colorId && (
                    <div>
                      <span className="font-medium">Color:</span>{' '}
                      <Badge variant="outline" className="text-xs">
                        Custom Color
                      </Badge>
                    </div>
                  )}
                </div>
                
                <Button
                  onClick={() => handleApplyTemplate(template)}
                  className="w-full mt-4"
                  size="sm"
                >
                  Apply Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}