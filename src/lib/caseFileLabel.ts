/**
 * Libellé d'affichage pour une ligne `case_files` :
 * project_name, puis title, puis ref, puis début d'UUID.
 */
export function caseFileLabel(cf: {
  project_name?: string | null;
  title?: string | null;
  ref?: string | null;
  id?: string;
}): string {
  const name = typeof cf.project_name === 'string' ? cf.project_name.trim() : '';
  if (name) return name;
  const title = typeof cf.title === 'string' ? cf.title.trim() : '';
  if (title) return title;
  const ref = typeof cf.ref === 'string' ? cf.ref.trim() : '';
  if (ref) return ref;
  if (cf.id) return cf.id.slice(0, 8);
  return '-';
}

/**
 * Texte descriptif : colonne `project_description` ou ancienne `description`.
 */
export function caseFileDescription(cf: {
  project_description?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
}): string | null {
  const metaDescription =
    cf.metadata && typeof cf.metadata.description === 'string' ? cf.metadata.description : null;
  const raw = cf.project_description ?? cf.description ?? metaDescription;
  if (typeof raw !== 'string') return null;
  const t = raw.trim();
  return t.length > 0 ? t : null;
}

/**
 * Type normalisé de dossier :
 * colonne `type`, puis metadata.type, puis valeur par défaut.
 */
export function caseFileType(cf: {
  type?: string | null;
  metadata?: Record<string, unknown> | null;
}): string {
  const direct = typeof cf.type === 'string' ? cf.type.trim() : '';
  if (direct) return direct;
  const metaType =
    cf.metadata && typeof cf.metadata.type === 'string' ? cf.metadata.type.trim() : '';
  if (metaType) return metaType;
  return 'Project Finance';
}
