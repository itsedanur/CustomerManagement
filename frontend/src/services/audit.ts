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
  getAll: async (page = 0, size = 20, search?: string, action?: string): Promise<PageResponse<AuditLog>> => {
    let url = `/api/audit-logs?page=${page}&size=${size}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (action && action !== 'ALL') url += `&action=${encodeURIComponent(action)}`;
    const response = await api.get(url);
    return response.data;
  },
};
