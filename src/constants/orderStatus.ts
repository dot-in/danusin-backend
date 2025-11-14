export const ORDER_STATUS = {
  MENUNGGU: "Menunggu Pembayaran",
  DIPROSES: "Diproses",
  SIAP: "Siap Diambil",
  SELESAI: "Selesai",
  DIBATALKAN: "Dibatalkan",
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [ORDER_STATUS.MENUNGGU]: [ORDER_STATUS.DIPROSES, ORDER_STATUS.DIBATALKAN],
  [ORDER_STATUS.DIPROSES]: [ORDER_STATUS.SIAP, ORDER_STATUS.DIBATALKAN],
  [ORDER_STATUS.SIAP]: [ORDER_STATUS.SELESAI],
  [ORDER_STATUS.SELESAI]: [],
  [ORDER_STATUS.DIBATALKAN]: [],
};
