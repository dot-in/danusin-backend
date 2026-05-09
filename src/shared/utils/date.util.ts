export const isDateInFuture = (date: Date | string): boolean => {
  return new Date(date) > new Date();
};

export const isDateInPast = (date: Date | string): boolean => {
  return new Date(date) < new Date();
};

export const isDateBetween = (date: Date | string, start: Date | string, end: Date | string): boolean => {
  const d = new Date(date);
  return d >= new Date(start) && d <= new Date(end);
};

export const formatDateToSQL = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

export const isPOOpen = (openDate: Date | string, closeDate: Date | string): boolean => {
  const now = new Date();
  return now >= new Date(openDate) && now <= new Date(closeDate);
};

export const getAvailableDays = (startDate: Date | string, endDate: Date | string): string[] => {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const order = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
  const available = new Set<string>();
  const curr = new Date(startDate);
  const end = new Date(endDate);
  while (curr <= end) {
    available.add(days[curr.getDay()]);
    curr.setDate(curr.getDate() + 1);
  }
  return order.filter(d => available.has(d));
};
