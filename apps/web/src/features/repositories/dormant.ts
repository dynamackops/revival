export function humanizeDormantDuration(lastCommitAt: string | null | undefined): string {
  if (!lastCommitAt) return "No commits recorded yet";

  const then = new Date(lastCommitAt).getTime();
  if (Number.isNaN(then)) return "Unknown";

  const diffMs = Math.max(0, Date.now() - then);
  const days = Math.floor(diffMs / 86_400_000);

  if (days < 1) return "Active today";
  if (days === 1) return "Dormant 1 day";
  if (days < 30) return `Dormant ${days} days`;

  const months = Math.floor(days / 30);
  if (months < 12) return `Dormant ${months} month${months === 1 ? "" : "s"}`;

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) return `Dormant ${years} year${years === 1 ? "" : "s"}`;
  return `Dormant ${years}y ${remainingMonths}m`;
}
