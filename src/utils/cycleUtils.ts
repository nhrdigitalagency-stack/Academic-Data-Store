/**
 * Normalise et formate les appellations officielles des cycles d'enseignement :
 * - Premier Cycle (6e - 3e)
 * - Second Cycle (2nde - Tle)
 */
export function formatCycleLevel(level?: string): string {
  if (!level) return 'Premier Cycle (6e - 3e)';
  const normalized = level.trim().toLowerCase();

  if (
    normalized.includes('collège') ||
    normalized.includes('college') ||
    normalized.includes('premier cycle') ||
    normalized.includes('6e à 3e') ||
    normalized.includes('6e - 3e')
  ) {
    return 'Premier Cycle (6e - 3e)';
  }

  if (
    normalized.includes('lycée') ||
    normalized.includes('lycee') ||
    normalized.includes('second cycle') ||
    normalized.includes('2nde à tle') ||
    normalized.includes('2nde - tle')
  ) {
    return 'Second Cycle (2nde - Tle)';
  }

  return level;
}
