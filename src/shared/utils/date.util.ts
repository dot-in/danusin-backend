export const isDateInFuture = (date: Date | string): boolean => {
  const compareDate = typeof date === "string" ? new Date(date) : date;
  return compareDate > new Date();
};

export const isDateInPast = (date: Date | string): boolean => {
  const compareDate = typeof date === "string" ? new Date(date) : date;
  return compareDate < new Date();
};

export const isDateBetween = (
  date: Date | string,
  start: Date | string,
  end: Date | string
): boolean => {
  const checkDate = typeof date === "string" ? new Date(date) : date;
  const startDate = typeof start === "string" ? new Date(start) : start;
  const endDate = typeof end === "string" ? new Date(end) : end;

  return checkDate >= startDate && checkDate <= endDate;
};

export const formatDateToSQL = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

export const isPOOpen = (
  openDate: Date | string,
  closeDate: Date | string
): boolean => {
  const today = new Date();
  const open = typeof openDate === "string" ? new Date(openDate) : openDate;
  const close = typeof closeDate === "string" ? new Date(closeDate) : closeDate;

  return today >= open && today <= close;
};
