export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidWhatsApp = (phone: string): boolean => {
  return /^(\+62|62|0)[0-9]{9,12}$/.test(phone.replace(/\s+/g, ""));
};

export const isValidNIM = (nim: string): boolean => {
  return nim.length >= 8 && nim.length <= 20 && /^[0-9]+$/.test(nim);
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/\s+/g, " ");
};

export const isValidImageExtension = (filename: string, allowedExtensions: string[]): boolean => {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext ? allowedExtensions.includes(ext) : false;
};
