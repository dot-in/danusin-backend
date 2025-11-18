export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidWhatsApp = (phone: string): boolean => {
  const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ""));
};

export const isValidNIM = (nim: string): boolean => {
  return nim.length >= 8 && nim.length <= 20 && /^[0-9]+$/.test(nim);
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/\s+/g, " ");
};

export const isValidImageExtension = (
  filename: string,
  allowedExtensions: string[]
): boolean => {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext ? allowedExtensions.includes(ext) : false;
};
