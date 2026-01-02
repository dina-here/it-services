export function iso(d: Date) {
  return d.toISOString();
}

export function formatDate(isoStr: string) {
  try {
    return new Date(isoStr).toLocaleDateString();
  } catch {
    return isoStr;
  }
}
