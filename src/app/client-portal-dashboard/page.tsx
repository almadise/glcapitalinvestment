import React from 'react';
import PortalLayout from '@/components/PortalLayout';
import PortalDashboardContent from './components/PortalDashboardContent';

export default function ClientPortalDashboardPage() {
  return (
    <PortalLayout>
      <PortalDashboardContent />
    </PortalLayout>
  );
}