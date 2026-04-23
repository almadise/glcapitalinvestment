import BackOfficeLayout from '@/components/BackOfficeLayout';
import EmailPreviewWorkspace from '@/components/email/EmailPreviewWorkspace';

export default function BackOfficeEmailPreviewPage() {
  return (
    <BackOfficeLayout role="admin" userName="Sophie Mercier">
      <EmailPreviewWorkspace />
    </BackOfficeLayout>
  );
}
