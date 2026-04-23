/**
 * Libellé d'affichage pour une ligne `case_files` : nom de projet, sinon référence, sinon début d'UUID.
 */
export function caseFileLabel(cf: {
  project_name?: string | null;
  ref?: string | null;
  id?: string;
}): string {
  const name = typeof cf.project_name === 'string' ? cf.project_name.trim() : '';
  if (name) return name;
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
}): string | null {
  const raw = cf.project_description ?? cf.description;
  if (typeof raw !== 'string') return null;
  const t = raw.trim();
  return t.length > 0 ? t : null;
}
