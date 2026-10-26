export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}
