import api from './api';
import type { PageResponse } from './customer';

export interface AuditLog {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
  } | null;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress: string;
  details: string;
  createdAt: string;
}

export const auditApi = {
  getAll: async (page = 0, size = 20): Promise<PageResponse<AuditLog>> => {
    const response = await api.get(`/api/audit-logs?page=${page}&size=${size}`);
    return response.data;
  },
};
