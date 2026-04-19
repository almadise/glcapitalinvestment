'use client';
import { HelpCircle } from 'lucide-react';
import { ContentManager } from '../components/ContentManager';
export default function ContentFAQPage() {
  return <ContentManager type="faq" title="FAQ" icon={HelpCircle} />;
}
