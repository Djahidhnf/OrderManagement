// Maps Prisma enum identifiers → French display strings (used in API responses)
export const STATUS_DISPLAY: Record<string, string> = {
  Nouveau: 'Nouveau',
  En_route: 'En route',
  Livre: 'Livré',
  Annule: 'Annulé',
  Retour: 'Retour',
};

// Maps French display strings → Prisma enum identifiers (used in where clauses / updates)
export const DISPLAY_TO_STATUS: Record<string, string> = Object.fromEntries(
  Object.entries(STATUS_DISPLAY).map(([k, v]) => [v, k])
);

export function toDisplay(status: string): string {
  return STATUS_DISPLAY[status] ?? status;
}

export function toPrisma(display: string): string {
  return DISPLAY_TO_STATUS[display] ?? display;
}
