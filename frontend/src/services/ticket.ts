import api from './api';
import type { PageResponse } from './customer';

export interface Ticket {
  id: number;
  ticketNumber: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  customer: {
    id: number;
    firstName: string;
    lastName: string;
  };
  assignedUserId?: number;
  createdAt: string;
  updatedAt: string;
}

export const ticketApi = {

  getAll: async (
    page = 0, 
    size = 10, 
    status?: string, 
    priority?: string,
    search?: string
  ): Promise<PageResponse<Ticket>> => {
    let url = `/api/tickets?page=${page}&size=${size}`;
    if (status && status !== 'ALL') url += `&status=${status}`;
    if (priority && priority !== 'ALL') url += `&priority=${priority}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const response = await api.get(url);
    return response.data;
  },

  getByCustomer: async (customerId: number, page = 0, size = 10): Promise<PageResponse<Ticket>> => {
    const response = await api.get(`/api/customers/${customerId}/tickets?page=${page}&size=${size}`);
    return response.data;
  },

  getById: async (id: number): Promise<Ticket> => {
    const response = await api.get(`/api/tickets/${id}`);
    return response.data;
  },

  create: async (customerId: number, data: any): Promise<Ticket> => {
    const response = await api.post(`/api/customers/${customerId}/tickets`, data);
    return response.data;
  },

  startProgress: async (id: number): Promise<Ticket> => {
    const response = await api.patch(`/api/tickets/${id}/start`);
    return response.data;
  },

  resolve: async (id: number): Promise<Ticket> => {
    const response = await api.patch(`/api/tickets/${id}/resolve`);
    return response.data;
  },

  reopen: async (id: number): Promise<Ticket> => {
    const response = await api.patch(`/api/tickets/${id}/reopen`);
    return response.data;
  },

  close: async (id: number): Promise<Ticket> => {
    const response = await api.patch(`/api/tickets/${id}/close`);
    return response.data;
  },

  assign: async (id: number, assignedUserId: number): Promise<Ticket> => {
    const response = await api.patch(`/api/tickets/${id}/assignment`, { assignedUserId });
    return response.data;
  },

  changePriority: async (id: number, priority: string): Promise<Ticket> => {
    const response = await api.patch(`/api/tickets/${id}/priority`, { priority });
    return response.data;
  }
};
