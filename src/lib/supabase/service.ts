import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Client Supabase avec la clé **service_role** - réservé aux routes API / serveur uniquement.
 * Contourne RLS là où les politiques sont limitées au service_role (ex. contact_pending_verifications).
 */
export function createServiceRoleClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant');
  }
  const isLegacyJwtKey = serviceKey.startsWith('eyJ') && serviceKey.length >= 100;
  const isSecretApiKey = serviceKey.startsWith('sb_secret_');

  if (!isLegacyJwtKey && !isSecretApiKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY invalide : utilisez la clé "service_role" (JWT long "eyJ...") ou une clé API secrète "sb_secret_..." depuis le dashboard Supabase.'
    );
  }
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
