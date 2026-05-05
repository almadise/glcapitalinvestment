import React from 'react';
import BackOfficeLayout from '@/components/BackOfficeLayout';
import BackOfficeDashboard from './components/BackOfficeDashboard';
import { createClient } from '@/lib/supabase/server';

export default async function BackOfficeAdminPanelPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    'Administrateur';

  return (
    <BackOfficeLayout role="admin" userName={userName}>
      <BackOfficeDashboard />
    </BackOfficeLayout>
  );
}
