import api from './api';

export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  customerType: 'INDIVIDUAL' | 'CORPORATE';
  createdAt: string;
  updatedAt: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export const customerApi = {
  getAll: async (page = 0, size = 10, search = '', status?: string, customerType?: string): Promise<PageResponse<Customer>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    if (search) params.append('search', search);
    if (status && status !== 'ALL') params.append('status', status);
    if (customerType && customerType !== 'ALL') params.append('customerType', customerType);
    
    const response = await api.get(`/api/customers?${params.toString()}`);
    return response.data;
  },

  getById: async (id: number): Promise<Customer> => {
    const response = await api.get(`/api/customers/${id}`);
    return response.data;
  },

  create: async (data: any): Promise<Customer> => {
    const response = await api.post('/api/customers', data);
    return response.data;
  },

  update: async (id: number, data: any): Promise<Customer> => {
    const response = await api.put(`/api/customers/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/customers/${id}`);
  }
};
