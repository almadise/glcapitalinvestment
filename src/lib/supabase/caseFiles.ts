interface InsertCaseFileOptions {
  supabase: any;
  payload: Record<string, unknown>;
  selectColumns?: string[];
  single?: boolean;
  maxRetries?: number;
}

interface InsertCaseFileResult<T = unknown> {
  data: T | null;
  removedColumns: string[];
}

function getMissingColumn(errorMessage: string): string | null {
  const match = errorMessage.match(/column ["']?([a-zA-Z0-9_]+)["']? of relation ["']?case_files["']? does not exist/i);
  return match?.[1] ?? null;
}

export async function insertCaseFileWithSchemaFallback<T = unknown>({
  supabase,
  payload,
  selectColumns,
  single = false,
  maxRetries = 12,
}: InsertCaseFileOptions): Promise<InsertCaseFileResult<T>> {
  const workingPayload: Record<string, unknown> = { ...payload };
  const removedColumns: string[] = [];

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const query = supabase.from('case_files').insert(workingPayload);
    const selectExpr = Array.isArray(selectColumns) && selectColumns.length > 0 ? selectColumns.join(',') : '*';
    const withSelect = query.select(selectExpr);

    const result = single ? await withSelect.single() : await (withSelect as any);
    const { data, error } = result as { data: T | null; error: any };

    if (!error) {
      return { data, removedColumns };
    }

    const message = String(error?.message || '');
    const missingColumn = getMissingColumn(message);
    const canRetry =
      Boolean(missingColumn) &&
      Object.prototype.hasOwnProperty.call(workingPayload, missingColumn as string);

    if (!canRetry) {
      throw error;
    }

    delete workingPayload[missingColumn as string];
    removedColumns.push(missingColumn as string);
  }

  throw new Error('Insertion case_files impossible: trop de colonnes incompatibles.');
}
