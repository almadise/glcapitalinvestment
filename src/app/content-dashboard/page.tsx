'use client';
import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ContentLayout from './components/ContentLayout';
import Link from 'next/link';
import { FileText, HelpCircle, Newspaper, BookOpen, ArrowRight, Loader2, PenSquare } from 'lucide-react';

interface ContentStats {
  pages: number;
  faq: number;
  articles: number;
  glossaire: number;
}

export default function ContentDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ContentStats>({ pages: 0, faq: 0, articles: 0, glossaire: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    Promise.all([
      supabase.from('content_pages').select('id', { count: 'exact', head: true }).eq('type', 'page'),
      supabase.from('content_pages').select('id', { count: 'exact', head: true }).eq('type', 'faq'),
      supabase.from('content_pages').select('id', { count: 'exact', head: true }).eq('type', 'article'),
      supabase.from('content_pages').select('id', { count: 'exact', head: true }).eq('type', 'glossaire'),
    ]).then(([pages, faq, articles, glossaire]) => {
      setStats({
        pages: pages.count || 0,
        faq: faq.count || 0,
        articles: articles.count || 0,
        glossaire: glossaire.count || 0,
      });
      setLoading(false);
    });
  }, [user]);

  const kpis = [
    { label: 'Pages', value: stats.pages, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', href: '/content-dashboard/pages' },
    { label: 'FAQ', value: stats.faq, icon: HelpCircle, color: 'text-amber-600', bg: 'bg-amber-50', href: '/content-dashboard/faq' },
    { label: 'Articles', value: stats.articles, icon: Newspaper, color: 'text-emerald-600', bg: 'bg-emerald-50', href: '/content-dashboard/articles' },
    { label: 'Glossaire', value: stats.glossaire, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50', href: '/content-dashboard/glossaire' },
  ];

  const quickLinks = [
    { label: 'Gérer les Pages', href: '/content-dashboard/pages', icon: FileText, desc: 'Créer et modifier les pages du site' },
    { label: 'Gérer la FAQ', href: '/content-dashboard/faq', icon: HelpCircle, desc: 'Questions fréquemment posées' },
    { label: 'Gérer les Articles', href: '/content-dashboard/articles', icon: Newspaper, desc: 'Publications et actualités' },
    { label: 'Gérer le Glossaire', href: '/content-dashboard/glossaire', icon: BookOpen, desc: 'Termes et définitions financières' },
  ];

  return (
    <ContentLayout>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <PenSquare size={20} className="text-purple-600" />
          <h1 className="font-display text-2xl font-bold text-navy">Gestion du Contenu</h1>
        </div>
        <p className="text-slate-500 text-sm">Gérez les pages, FAQ, articles et glossaire du portail</p>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3 mb-6">
        <PenSquare size={18} className="text-purple-600 flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-purple-800 text-sm">Accès Gestionnaire Contenu</div>
          <div className="text-purple-700 text-xs mt-0.5">Vous pouvez gérer les pages, FAQ, articles et le glossaire. L'accès aux dossiers KYC/AML est réservé aux rôles Compliance et Analyste.</div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><Loader2 size={28} className="animate-spin text-gold" /></div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpis.map((kpi) => (
            <Link key={kpi.label} href={kpi.href} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-purple-200 hover:shadow-md transition-all group">
              <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center mb-3`}>
                <kpi.icon size={20} className={kpi.color} />
              </div>
              <div className="text-2xl font-bold text-navy">{kpi.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{kpi.label}</div>
            </Link>
          ))}
        </div>
      )}

      <div className="mb-4">
        <h2 className="font-semibold text-navy text-base mb-3">Accès rapide</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickLinks.map((link) => (
            <Link key={link.label} href={link.href} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 hover:border-purple-200 hover:shadow-md transition-all group">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                <link.icon size={18} className="text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-navy text-sm">{link.label}</div>
                <div className="text-xs text-slate-500 truncate">{link.desc}</div>
              </div>
              <ArrowRight size={16} className="text-slate-400 group-hover:text-purple-600 transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </ContentLayout>
  );
}
