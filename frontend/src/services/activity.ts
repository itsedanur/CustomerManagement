import api from './api';

export interface Activity {
  id: number;
  customerId: number;
  type: string;
  entityId: number;
  description: string;
  createdAt: string;
  performedBy?: {
    id: number;
    name: string;
  } | null;
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

export const activityApi = {
  getByCustomer: async (customerId: number): Promise<Activity[]> => {
    const response = await api.get(`/api/customers/${customerId}/activities`);
    return response.data;
  },
  
  getAll: async (page = 0, size = 20): Promise<PageResponse<Activity>> => {
    const response = await api.get('/api/activities', {
      params: { page, size }
    });
    return response.data;
  }
};
