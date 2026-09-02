import api from './api';

export interface CrmTask {
  id: number;
  title: string;
  description?: string;
  customerId?: number;
  customerName?: string;
  ticketId?: number;
  ticketNumber?: string;
  assignedUserId: number;
  assignedUserName: string;
  createdByUserId: number;
  createdByUserName: string;
  dueDate?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  isOverdue: boolean;
}

export interface CrmTaskParams {
  search?: string;
  status?: string;
  priority?: string;
  assignedUserId?: number;
  customerId?: number;
  ticketId?: number;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  customerId?: number;
  ticketId?: number;
  assignedUserId: number;
  dueDate?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface PageTaskResponse {
  content: CrmTask[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const taskApi = {
  getAll: async (params?: CrmTaskParams): Promise<PageTaskResponse> => {
    const res = await api.get<PageTaskResponse>('/tasks', {
      params: {
        ...params,
        status: params?.status === 'ALL' ? undefined : params?.status,
        priority: params?.priority === 'ALL' ? undefined : params?.priority,
      },
    });
    return res.data;
  },

  getById: async (id: number): Promise<CrmTask> => {
    const res = await api.get<CrmTask>(`/tasks/${id}`);
    return res.data;
  },

  create: async (payload: CreateTaskPayload): Promise<CrmTask> => {
    const res = await api.post<CrmTask>('/tasks', payload);
    return res.data;
  },

  update: async (id: number, payload: CreateTaskPayload): Promise<CrmTask> => {
    const res = await api.put<CrmTask>(`/tasks/${id}`, payload);
    return res.data;
  },

  updateStatus: async (id: number, status: string): Promise<CrmTask> => {
    const res = await api.patch<CrmTask>(`/tasks/${id}/status`, { status });
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },

  getMyDueToday: async (): Promise<CrmTask[]> => {
    const res = await api.get<CrmTask[]>('/tasks/my-due-today');
    return res.data;
  },

  getMyOverdue: async (): Promise<CrmTask[]> => {
    const res = await api.get<CrmTask[]>('/tasks/my-overdue');
    return res.data;
  },

  getByCustomerId: async (customerId: number): Promise<CrmTask[]> => {
    const res = await api.get<CrmTask[]>(`/tasks/customer/${customerId}`);
    return res.data;
  },

  getByTicketId: async (ticketId: number): Promise<CrmTask[]> => {
    const res = await api.get<CrmTask[]>(`/tasks/ticket/${ticketId}`);
    return res.data;
  },
};
