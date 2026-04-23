'use client';

import AdminLayout from '@/app/admin/components/AdminLayout';
import EmailPreviewWorkspace from '@/components/email/EmailPreviewWorkspace';

export default function AdminEmailPreviewPage() {
  return (
    <AdminLayout>
      <EmailPreviewWorkspace />
    </AdminLayout>
  );
}
