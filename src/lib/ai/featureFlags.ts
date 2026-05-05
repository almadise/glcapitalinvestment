const AI_ASSISTANT_LAUNCH_DATE_UTC = '2026-04-30T00:00:00.000Z';
const AI_ASSISTANT_NEW_BADGE_DAYS = 14;

export function shouldShowAiAssistantNewBadge(now: Date = new Date()): boolean {
  const launchMs = new Date(AI_ASSISTANT_LAUNCH_DATE_UTC).getTime();
  const endMs = launchMs + AI_ASSISTANT_NEW_BADGE_DAYS * 24 * 60 * 60 * 1000;
  const nowMs = now.getTime();
  return nowMs >= launchMs && nowMs < endMs;
}
