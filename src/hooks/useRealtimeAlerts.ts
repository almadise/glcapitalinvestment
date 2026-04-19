'use client';
import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface UseRealtimeAlertsOptions {
  enabled: boolean;
  lang?: string;
}

export function useRealtimeSubmissionAlerts({ enabled, lang = 'fr' }: UseRealtimeAlertsOptions) {
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();

    // Small delay to avoid firing on initial data load
    const timer = setTimeout(() => {
      isFirstLoad.current = false;
    }, 2000);

    channelRef.current = supabase
      .channel('admin_submission_alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'contact_submissions' },
        (payload) => {
          if (isFirstLoad.current) return;
          const row = payload.new as any;
          const name = row?.nom_complet || '—';
          const company = row?.societe || '';
          const amount = row?.montant_projet || '';
          toast.success(
            lang === 'fr'
              ? `Nouvelle soumission de ${name}${company ? ` — ${company}` : ''}${amount ? ` (${amount})` : ''}`
              : `New submission from ${name}${company ? ` — ${company}` : ''}${amount ? ` (${amount})` : ''}`,
            { duration: 6000, icon: '📬' }
          );
        }
      )
      .subscribe();

    return () => {
      clearTimeout(timer);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, lang]);
}

export function useRealtimeCaseUpdates({
  enabled,
  userId,
  lang = 'fr',
  onUpdate,
}: {
  enabled: boolean;
  userId?: string;
  lang?: string;
  onUpdate?: (payload: any) => void;
}) {
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!enabled || !userId) return;

    const supabase = createClient();

    const timer = setTimeout(() => {
      isFirstLoad.current = false;
    }, 2000);

    channelRef.current = supabase
      .channel(`case_updates_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'case_files',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (isFirstLoad.current) return;
          const row = payload.new as any;
          const statusLabels: Record<string, { fr: string; en: string }> = {
            RECU: { fr: 'Reçu', en: 'Received' },
            EN_ANALYSE: { fr: 'En analyse', en: 'Under Review' },
            ELIGIBLE: { fr: 'Éligible', en: 'Eligible' },
            REJETE: { fr: 'Rejeté', en: 'Rejected' },
          };
          const statusLabel = statusLabels[row?.status]?.[lang === 'fr' ? 'fr' : 'en'] || row?.status;
          toast.info(
            lang === 'fr'
              ? `Dossier "${row?.title}" mis à jour → ${statusLabel}`
              : `Case "${row?.title}" updated → ${statusLabel}`,
            { duration: 7000, icon: '📋' }
          );
          onUpdate?.(payload);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(timer);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, userId, lang, onUpdate]);
}
