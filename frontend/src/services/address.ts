import api from './api';

export interface Address {
  id: number;
  title: string;
  country: string;
  city: string;
  district: string;
  postalCode: string;
  addressLine: string;
  addressType: 'HOME' | 'WORK' | 'BILLING' | 'SHIPPING' | 'OTHER';
}

export const addressApi = {
  getByCustomer: async (customerId: number): Promise<Address[]> => {
    const response = await api.get(`/api/customers/${customerId}/addresses`);
    return response.data;
  },

  create: async (customerId: number, data: any): Promise<Address> => {
    const response = await api.post(`/api/customers/${customerId}/addresses`, data);
    return response.data;
  },

  update: async (customerId: number, addressId: number, data: any): Promise<Address> => {
    const response = await api.put(`/api/customers/${customerId}/addresses/${addressId}`, data);
    return response.data;
  },

  delete: async (customerId: number, addressId: number): Promise<void> => {
    await api.delete(`/api/customers/${customerId}/addresses/${addressId}`);
  }
};
