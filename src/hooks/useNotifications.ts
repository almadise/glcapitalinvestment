'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useNotificationCount() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    const fetchCount = async () => {
      const { count } = await supabase?.from('notifications')?.select('*', { count: 'exact', head: true })?.eq('user_id', user?.id)?.eq('is_read', false);
      setUnreadCount(count || 0);
    };

    fetchCount();

    const channel = supabase?.channel('notification-count')?.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user?.id}`,
      }, () => {
        fetchCount();
      })?.subscribe();

    return () => { supabase?.removeChannel(channel); };
  }, [user]);

  return unreadCount;
}
