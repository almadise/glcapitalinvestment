'use client';
import { BookOpen } from 'lucide-react';
import { ContentManager } from '../components/ContentManager';
export default function ContentGlossairePage() {
  return <ContentManager type="glossaire" title="Glossaire" icon={BookOpen} />;
}
