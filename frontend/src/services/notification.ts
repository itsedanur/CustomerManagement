import api from './api';

export interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  targetUrl: string;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}

export const notificationApi = {
  getAll: async (page = 0, size = 10): Promise<PageResponse<Notification>> => {
    const response = await api.get('/api/notifications', {
      params: { page, size }
    });
    return response.data;
  },
  
  getUnread: async (): Promise<Notification[]> => {
    const response = await api.get('/api/notifications/unread');
    return Array.isArray(response.data) ? response.data : [];
  },
  
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get('/api/notifications/unread-count');
    return typeof response.data === 'number' ? response.data : (Number(response.data) || 0);
  },
  
  markAsRead: async (id: number): Promise<void> => {
    await api.patch(`/api/notifications/${id}/read`);
  },
  
  markAllAsRead: async (): Promise<void> => {
    await api.patch('/api/notifications/read-all');
  }
};
