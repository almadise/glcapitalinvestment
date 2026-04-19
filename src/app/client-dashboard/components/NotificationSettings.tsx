'use client';
import React, { useState, useEffect } from 'react';
import { Bell, Mail, Zap, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface NotificationPrefs {
  realtime_alerts: boolean;
  email_notifications: boolean;
}

export default function NotificationSettings() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const supabase = createClient();

  const [prefs, setPrefs] = useState<NotificationPrefs>({
    realtime_alerts: true,
    email_notifications: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    setError(null);
    supabase
      .from('user_profiles')
      .select('notification_prefs')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data, error: fetchErr }) => {
        if (fetchErr) {
          console.error('NotificationSettings fetch error:', fetchErr.message);
          setError(fetchErr.message);
        } else if (data?.notification_prefs) {
          setPrefs({
            realtime_alerts: data.notification_prefs.realtime_alerts ?? true,
            email_notifications: data.notification_prefs.email_notifications ?? true,
          });
        }
        setLoading(false);
      });
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    setError(null);
    try {
      const { error: upsertErr } = await supabase
        .from('user_profiles')
        .update({ notification_prefs: prefs, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (upsertErr) throw upsertErr;

      setSaved(true);
      toast.success(t('Préférences de notifications enregistrées', 'Notification preferences saved'));
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err.message || t('Erreur lors de l\'enregistrement', 'Error saving preferences'));
      toast.error(err.message || t('Erreur lors de l\'enregistrement', 'Error saving preferences'));
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: keyof NotificationPrefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const items = [
    {
      key: 'realtime_alerts' as const,
      icon: Zap,
      iconBg: 'bg-amber-50 border-amber-200',
      iconColor: 'text-amber-600',
      title: t('Alertes en temps réel', 'Real-Time Alerts'),
      desc: t(
        'Notifications instantanées lors de mises à jour de vos dossiers',
        'Instant notifications when your case files are updated'
      ),
    },
    {
      key: 'email_notifications' as const,
      icon: Mail,
      iconBg: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-600',
      title: t('Notifications par email', 'Email Notifications'),
      desc: t(
        'Recevez les mises à jour importantes par email',
        'Receive important updates by email'
      ),
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
        <div className="w-9 h-9 rounded-lg bg-navy/5 border border-navy/10 flex items-center justify-center">
          <Bell size={16} className="text-navy" />
        </div>
        <div>
          <h3 className="font-semibold text-navy text-sm">
            {t('Paramètres de notifications', 'Notification Settings')}
          </h3>
          <p className="text-slate-400 text-xs">
            {t('Gérez vos préférences de notifications', 'Manage your notification preferences')}
          </p>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-5 mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Toggles */}
      <div className="divide-y divide-slate-100">
        {items.map(({ key, icon: ItemIcon, iconBg, iconColor, title, desc }) => (
          <div key={key} className="flex items-center justify-between px-5 py-4 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                <ItemIcon size={16} className={iconColor} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">{title}</p>
                <p className="text-xs text-slate-400 truncate">{desc}</p>
              </div>
            </div>
            {/* Toggle switch */}
            <button
              type="button"
              onClick={() => toggle(key)}
              disabled={loading}
              aria-label={title}
              aria-checked={prefs[key]}
              role="switch"
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 ${
                prefs[key] ? 'bg-navy' : 'bg-slate-200'
              } disabled:opacity-50`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  prefs[key] ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Save button */}
      <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-navy text-white hover:bg-navy/90 active:scale-95"
        >
          {saved ? (
            <>
              <CheckCircle2 size={15} className="text-emerald-300" />
              {t('Enregistré', 'Saved')}
            </>
          ) : saving ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t('Enregistrement…', 'Saving…')}
            </>
          ) : (
            <>
              <Save size={15} />
              {t('Enregistrer', 'Save')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
