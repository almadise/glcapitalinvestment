/**
 * Lien vers la page des modèles d'email Auth du projet sur Supabase Cloud.
 * Pour un projet hébergé ailleurs, renseignez NEXT_PUBLIC_SUPABASE_PROJECT_REF.
 */
export function getSupabaseAuthTemplatesUrl(): string | null {
  const explicit = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF?.trim();
  if (explicit) {
    return `https://supabase.com/dashboard/project/${explicit}/auth/templates`;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    const host = new URL(url).hostname;
    if (host.includes('localhost')) return null;
    const ref = host.split('.')[0];
    if (!ref) return null;
    return `https://supabase.com/dashboard/project/${ref}/auth/templates`;
  } catch {
    return null;
  }
}
