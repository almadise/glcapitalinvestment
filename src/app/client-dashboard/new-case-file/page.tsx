'use client';
import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import NewCaseFileWizard from './components/NewCaseFileWizard';

export default function NewCaseFilePage() {
  return (
    <DashboardLayout>
      <NewCaseFileWizard />
    </DashboardLayout>
  );
}
