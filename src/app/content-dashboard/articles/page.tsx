'use client';
import { Newspaper } from 'lucide-react';
import { ContentManager } from '../components/ContentManager';
export default function ContentArticlesPage() {
  return <ContentManager type="article" title="Articles" icon={Newspaper} />;
}
