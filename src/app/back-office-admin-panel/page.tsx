import React from 'react';
import BackOfficeLayout from '@/components/BackOfficeLayout';
import BackOfficeDashboard from './components/BackOfficeDashboard';

export default function BackOfficeAdminPanelPage() {
  return (
    <BackOfficeLayout role="admin" userName="Sophie Mercier">
      <BackOfficeDashboard />
    </BackOfficeLayout>
  );
}