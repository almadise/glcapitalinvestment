'use client';
import { FileText } from 'lucide-react';
import { ContentManager } from '../components/ContentManager';
export default function ContentPagesPage() {
  return <ContentManager type="page" title="Pages" icon={FileText} />;
}
