export const MESSAGE_RECALL_WINDOW_SECONDS = 120;
export const MESSAGE_RECALL_WINDOW_MS = MESSAGE_RECALL_WINDOW_SECONDS * 1000;

export function canRecallByCreatedAt(createdAt?: string | Date | null): boolean {
  if (!createdAt) return false;

  const created = createdAt instanceof Date ? createdAt : new Date(createdAt);
  if (Number.isNaN(created.getTime())) return false;

  return Date.now() - created.getTime() <= MESSAGE_RECALL_WINDOW_MS;
}
