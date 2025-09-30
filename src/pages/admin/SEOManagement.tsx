import { AdminLayout } from '@/components/admin/AdminLayout';
import { MetaTagsManager } from '@/components/admin/MetaTagsManager';

export default function SEOManagement() {
  return (
    <AdminLayout>
      <MetaTagsManager />
    </AdminLayout>
  );
}
