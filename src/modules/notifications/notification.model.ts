export interface NotificationResponse {
  id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  type: string | null;
  created_at: Date;
}

export interface NotificationUnreadCountResponse {
  unread_count: number;
}
