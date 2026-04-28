export function getSaturdayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day - 1; // 0 is Sunday. If today is Saturday (6), diff is d.getDate() - 6 - 1 = d.getDate() - 7
  // Let's adjust: In Egypt, week starts on Saturday. 
  // JS getDay(): 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday.
  // We want to find the most recent Saturday.
  const diffToSaturday = day === 6 ? 0 : day + 1;
  d.setDate(d.getDate() - diffToSaturday);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const ARABIC_DAYS = [
  "السبت",
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة"
];

export function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}
