'use client';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useNotificationCount() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const fetchCount = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      setUnreadCount(count || 0);
    };

    fetchCount();

    // Unique channel name avoids collisions when the hook is mounted in multiple components.
    const channelName = `notification-count-${user.id}-${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase.channel(channelName);
    channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        fetchCount();
      });
    channel.subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, supabase]);

  return unreadCount;
}
