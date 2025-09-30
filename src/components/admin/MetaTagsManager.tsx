import { useState } from 'react';
import { useAllMetaTags } from '@/hooks/useMetaTags';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { DataTable } from './shared/DataTable';

export function MetaTagsManager() {
  const { data: metaTags, refetch } = useAllMetaTags();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const [formData, setFormData] = useState({
    page_type: 'static' as const,
    page_identifier: '',
    title: '',
    description: '',
    keywords: '',
    og_title: '',
    og_description: '',
    og_image: '',
    canonical_url: '',
    robots: 'index, follow',
    is_active: true,
  });

  const handleSave = async () => {
    try {
      const keywordsArray = formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);

      const dataToSave = {
        ...formData,
        keywords: keywordsArray,
      };

      if (editingId) {
        const { error } = await supabase
          .from('meta_tags')
          .update(dataToSave)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Meta tags updated successfully');
      } else {
        const { error } = await supabase
          .from('meta_tags')
          .insert([dataToSave]);

        if (error) throw error;
        toast.success('Meta tags created successfully');
      }

      setEditingId(null);
      setIsCreating(false);
      resetForm();
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save meta tags');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete these meta tags?')) return;

    try {
      const { error } = await supabase
        .from('meta_tags')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Meta tags deleted successfully');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete meta tags');
    }
  };

  const handleEdit = (tag: any) => {
    setFormData({
      page_type: tag.page_type,
      page_identifier: tag.page_identifier,
      title: tag.title,
      description: tag.description,
      keywords: tag.keywords?.join(', ') || '',
      og_title: tag.og_title || '',
      og_description: tag.og_description || '',
      og_image: tag.og_image || '',
      canonical_url: tag.canonical_url || '',
      robots: tag.robots || 'index, follow',
      is_active: tag.is_active,
    });
    setEditingId(tag.id);
    setIsCreating(false);
  };

  const resetForm = () => {
    setFormData({
      page_type: 'static',
      page_identifier: '',
      title: '',
      description: '',
      keywords: '',
      og_title: '',
      og_description: '',
      og_image: '',
      canonical_url: '',
      robots: 'index, follow',
      is_active: true,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsCreating(false);
    resetForm();
  };

  const columns = [
    {
      key: 'page_identifier' as const,
      label: 'Page',
      render: (_: any, row: any) => (
        <div>
          <div className="font-medium">{row.page_identifier}</div>
          <Badge variant="secondary" className="text-xs mt-1">{row.page_type}</Badge>
        </div>
      ),
    },
    {
      key: 'title' as const,
      label: 'Title',
      render: (_: any, row: any) => (
        <div className="max-w-md">
          <div className="font-medium truncate">{row.title}</div>
          <div className="text-sm text-muted-foreground truncate">{row.description}</div>
        </div>
      ),
    },
    {
      key: 'is_active' as const,
      label: 'Status',
      render: (value: boolean) => (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  const actions = [
    {
      label: 'Edit',
      onClick: handleEdit,
      icon: <Edit className="h-4 w-4 mr-2" />,
    },
    {
      label: 'Delete',
      onClick: (row: any) => handleDelete(row.id),
      icon: <Trash2 className="h-4 w-4 mr-2" />,
      variant: 'destructive' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">SEO Meta Tags Management</h2>
          <p className="text-muted-foreground">
            Manage SEO metadata for all pages in your application
          </p>
        </div>
        {!isCreating && !editingId && (
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Meta Tags
          </Button>
        )}
      </div>

      {(isCreating || editingId) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Meta Tags' : 'Create Meta Tags'}</CardTitle>
            <CardDescription>
              Configure SEO metadata for this page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Page Type</Label>
                <Select
                  value={formData.page_type}
                  onValueChange={(value: any) => setFormData({ ...formData, page_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="static">Static Page</SelectItem>
                    <SelectItem value="product">Product Page</SelectItem>
                    <SelectItem value="category">Category Page</SelectItem>
                    <SelectItem value="room">Room Page</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Page Identifier (URL Path)</Label>
                <Input
                  value={formData.page_identifier}
                  onChange={(e) => setFormData({ ...formData, page_identifier: e.target.value })}
                  placeholder="/about-us"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Title (Max 60 characters)</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Custom Kitchens | Premium Quality"
                maxLength={60}
              />
              <p className="text-xs text-muted-foreground">{formData.title.length}/60</p>
            </div>

            <div className="space-y-2">
              <Label>Description (Max 160 characters)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Transform your space with custom-made kitchens..."
                maxLength={160}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">{formData.description.length}/160</p>
            </div>

            <div className="space-y-2">
              <Label>Keywords (comma-separated)</Label>
              <Input
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                placeholder="custom kitchens, kitchen cabinets, renovation"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>OG Title</Label>
                <Input
                  value={formData.og_title}
                  onChange={(e) => setFormData({ ...formData, og_title: e.target.value })}
                  placeholder="Leave empty to use main title"
                />
              </div>

              <div className="space-y-2">
                <Label>OG Image URL</Label>
                <Input
                  value={formData.og_image}
                  onChange={(e) => setFormData({ ...formData, og_image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>OG Description</Label>
              <Textarea
                value={formData.og_description}
                onChange={(e) => setFormData({ ...formData, og_description: e.target.value })}
                placeholder="Leave empty to use main description"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Canonical URL</Label>
                <Input
                  value={formData.canonical_url}
                  onChange={(e) => setFormData({ ...formData, canonical_url: e.target.value })}
                  placeholder="https://yourdomain.com/page"
                />
              </div>

              <div className="space-y-2">
                <Label>Robots</Label>
                <Select
                  value={formData.robots}
                  onValueChange={(value) => setFormData({ ...formData, robots: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="index, follow">Index, Follow</SelectItem>
                    <SelectItem value="noindex, follow">No Index, Follow</SelectItem>
                    <SelectItem value="index, nofollow">Index, No Follow</SelectItem>
                    <SelectItem value="noindex, nofollow">No Index, No Follow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Active</Label>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Existing Meta Tags</CardTitle>
        </CardHeader>
        <CardContent>
          {metaTags && metaTags.length > 0 ? (
            <DataTable columns={columns} data={metaTags} actions={actions} />
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No meta tags configured yet. Add one to get started.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
