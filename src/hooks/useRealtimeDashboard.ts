'use client';
import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface UseRealtimeCaseDashboardOptions {
  enabled: boolean;
  caseId?: string;
  lang?: string;
  onCaseUpdate?: (payload: any) => void;
  onNoteAdded?: (payload: any) => void;
  onStatusChange?: (payload: any) => void;
}

/**
 * Subscribes to real-time updates for a specific case:
 * - case_files updates (status changes)
 * - case_internal_notes inserts (new notes)
 * - case_status_history inserts (status history)
 */
export function useRealtimeCaseDashboard({
  enabled,
  caseId,
  lang = 'fr',
  onCaseUpdate,
  onNoteAdded,
  onStatusChange,
}: UseRealtimeCaseDashboardOptions) {
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!enabled || !caseId) return;

    const supabase = createClient();
    const timer = setTimeout(() => {
      isFirstLoad.current = false;
    }, 1500);

    channelRef.current = supabase
      .channel(`case_dashboard_${caseId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'case_files', filter: `id=eq.${caseId}` },
        (payload) => {
          if (isFirstLoad.current) return;
          const row = payload.new as any;
          toast.info(
            lang === 'fr'
              ? `Dossier mis à jour → ${row?.status || ''}`
              : `Case updated → ${row?.status || ''}`,
            { duration: 6000, icon: '📋' }
          );
          onCaseUpdate?.(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'case_internal_notes',
          filter: `case_id=eq.${caseId}`,
        },
        (payload) => {
          if (isFirstLoad.current) return;
          const row = payload.new as any;
          toast.info(
            lang === 'fr'
              ? `Nouvelle note ajoutée par ${row?.author_email || 'un analyste'}`
              : `New note added by ${row?.author_email || 'an analyst'}`,
            { duration: 5000, icon: '📝' }
          );
          onNoteAdded?.(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'case_status_history',
          filter: `case_id=eq.${caseId}`,
        },
        (payload) => {
          if (isFirstLoad.current) return;
          const row = payload.new as any;
          toast.success(
            lang === 'fr'
              ? `Statut changé : ${row?.old_status || '-'} → ${row?.new_status || ''}`
              : `Status changed: ${row?.old_status || '-'} → ${row?.new_status || ''}`,
            { duration: 7000, icon: '🔄' }
          );
          onStatusChange?.(payload);
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
  }, [enabled, caseId, lang, onCaseUpdate, onNoteAdded, onStatusChange]);
}

/**
 * Subscribes to all case_files changes (for dashboard-level views)
 * Used by Admin, Analyst, Compliance dashboards
 */
export function useRealtimeAllCases({
  enabled,
  lang = 'fr',
  onAnyUpdate,
}: {
  enabled: boolean;
  lang?: string;
  onAnyUpdate?: (payload: any) => void;
}) {
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();
    const timer = setTimeout(() => {
      isFirstLoad.current = false;
    }, 1500);

    channelRef.current = supabase
      .channel('all_cases_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'case_files' }, (payload) => {
        if (isFirstLoad.current) return;
        const row = (payload.new || payload.old) as any;
        if (payload.eventType === 'INSERT') {
          toast.success(
            lang === 'fr'
              ? `Nouveau dossier créé : "${row?.title || ''}"`
              : `New case created: "${row?.title || ''}"`,
            { duration: 6000, icon: '📁' }
          );
        } else if (payload.eventType === 'UPDATE') {
          toast.info(
            lang === 'fr'
              ? `Dossier mis à jour : "${row?.title || ''}" → ${row?.status || ''}`
              : `Case updated: "${row?.title || ''}" → ${row?.status || ''}`,
            { duration: 5000, icon: '🔄' }
          );
        }
        onAnyUpdate?.(payload);
      })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'case_internal_notes' },
        (payload) => {
          if (isFirstLoad.current) return;
          const row = payload.new as any;
          toast.info(
            lang === 'fr'
              ? `Note interne ajoutée par ${row?.author_email || 'un utilisateur'}`
              : `Internal note added by ${row?.author_email || 'a user'}`,
            { duration: 5000, icon: '📝' }
          );
          onAnyUpdate?.(payload);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'case_status_history' },
        (payload) => {
          if (isFirstLoad.current) return;
          const row = payload.new as any;
          toast.success(
            lang === 'fr'
              ? `Changement de statut : ${row?.old_status || '-'} → ${row?.new_status || ''}`
              : `Status change: ${row?.old_status || '-'} → ${row?.new_status || ''}`,
            { duration: 7000, icon: '✅' }
          );
          onAnyUpdate?.(payload);
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
  }, [enabled, lang, onAnyUpdate]);
}
