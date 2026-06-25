export const SUCCESS_MESSAGES = {
  AUTH: {
    REGISTER_SUCCESS: "Registrasi berhasil",
    LOGIN_SUCCESS: "Login berhasil",
    PROFILE_UPDATED: "Profil berhasil diperbarui",
    UPGRADE_SUCCESS: "Upgrade ke seller berhasil",
  },
  PRODUCT: {
    CREATED: "Produk berhasil dibuat",
    UPDATED: "Produk berhasil diperbarui",
    DELETED: "Produk berhasil dihapus",
  },
  ORDER: {
    CREATED: "Pesanan berhasil dibuat",
    STATUS_UPDATED: "Status pesanan berhasil diperbarui",
  },
  NOTIFICATION: {
    MARKED_READ: "Notifikasi ditandai sudah dibaca",
    ALL_MARKED_READ: "Semua notifikasi ditandai sudah dibaca",
  },
  UPLOAD: {
    SUCCESS: "File berhasil diupload",
  },
} as const;

export const ERROR_MESSAGES = {
  AUTH: {
    INVALID_CREDENTIALS: "Email/NIM atau password salah",
    EMAIL_EXISTS: "Email sudah terdaftar",
    NIM_EXISTS: "NIM sudah terdaftar",
    ALREADY_SELLER: "Anda sudah menjadi seller",
    WEAK_PASSWORD: "Password minimal 8 karakter",
  },
  PRODUCT: {
    NOT_FOUND: "Produk tidak ditemukan",
    NOT_OWNER: "Anda bukan pemilik produk ini",
    PO_CLOSED: "Pre-order sudah ditutup",
    INVALID_DATES: "Tanggal tidak valid",
  },
  ORDER: {
    NOT_FOUND: "Pesanan tidak ditemukan",
    NOT_AUTHORIZED: "Anda tidak memiliki akses ke pesanan ini",
    INVALID_STATUS_TRANSITION: "Transisi status tidak valid",
    INVALID_QUANTITY: "Jumlah pesanan tidak valid",
  },
  USER: {
    NOT_FOUND: "User tidak ditemukan",
    NOT_SELLER: "User bukan seller",
  },
  NOTIFICATION: {
    NOT_FOUND: "Notifikasi tidak ditemukan",
    NOT_OWNER: "Bukan notifikasi Anda",
  },
  UPLOAD: {
    NO_FILE: "Tidak ada file yang diupload",
    INVALID_TYPE: "Tipe file tidak valid",
    FILE_TOO_LARGE: "Ukuran file terlalu besar",
  },
  GENERAL: {
    UNAUTHORIZED: "Anda harus login terlebih dahulu",
    FORBIDDEN: "Akses ditolak",
    VALIDATION_ERROR: "Data tidak valid",
    SERVER_ERROR: "Terjadi kesalahan pada server",
  },
} as const;
