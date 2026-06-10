import { createClient } from '@/lib/supabase/client';

export type AuditAction =
  | 'STATUS_CHANGE'
  | 'DOCUMENT_UPLOAD'
  | 'NOTE_CREATED'
  | 'NOTE_EDITED'
  | 'EXPORT_CSV'
  | 'EXPORT_PDF'
  | 'CASE_CREATED'
  | 'CASE_VIEWED';

interface LogAuditParams {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  caseId?: string;
  actorId: string;
  actorEmail?: string;
  actorName?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export async function logAuditAction(params: LogAuditParams): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.from('audit_logs').insert({
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      case_id: params.caseId || null,
      actor_id: params.actorId,
      actor_email: params.actorEmail || null,
      actor_name: params.actorName || null,
      reason: params.reason || null,
      metadata: params.metadata || null,
    });
  } catch {
    // Audit logging should never break the main flow
  }
}
