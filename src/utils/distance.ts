export function formatMeters(meters: number): string {
  if (!Number.isFinite(meters)) return '-';

  if (Math.abs(meters) >= 1000) {
    const km = Math.round((meters / 1000) * 100) / 100;
    return `${km} km`;
  }

  return `${Math.round(meters)} m`;
}

export function formatSignedMeters(meters: number): string {
  if (!Number.isFinite(meters)) return '-';

  const sign = meters > 0 ? '+' : '';
  return `${sign}${formatMeters(meters)}`;
}
