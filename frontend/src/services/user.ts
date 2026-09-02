import api from './api';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'AGENT';
  enabled: boolean;
  openTicketsCount?: number;
  activeTasksCount?: number;
}

export const userApi = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get('/api/users');
    return response.data;
  },
  getAssignable: async (): Promise<User[]> => {
    const response = await api.get('/api/users/assignable');
    return response.data;
  },
  create: async (data: Omit<User, 'id'> & { password?: string }): Promise<User> => {
    const response = await api.post('/api/users', data);
    return response.data;
  },
  update: async (id: number, data: Omit<User, 'id'>): Promise<User> => {
    const response = await api.put(`/api/users/${id}`, data);
    return response.data;
  },
  changeRole: async (id: number, role: string): Promise<User> => {
    const response = await api.patch(`/api/users/${id}/role`, { role });
    return response.data;
  },
  changeStatus: async (id: number, enabled: boolean): Promise<User> => {
    const response = await api.patch(`/api/users/${id}/status`, { enabled });
    return response.data;
  }
};
