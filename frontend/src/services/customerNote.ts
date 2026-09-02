import api from './api';

export interface CustomerNote {
  id: number;
  customerId: number;
  authorUserId: number;
  authorName: string;
  authorEmail: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export const customerNoteApi = {
  getByCustomerId: async (customerId: number): Promise<CustomerNote[]> => {
    const res = await api.get<CustomerNote[]>(`/customers/${customerId}/notes`);
    return res.data;
  },

  create: async (customerId: number, content: string): Promise<CustomerNote> => {
    const res = await api.post<CustomerNote>(`/customers/${customerId}/notes`, { content });
    return res.data;
  },

  update: async (noteId: number, content: string): Promise<CustomerNote> => {
    const res = await api.put<CustomerNote>(`/customers/notes/${noteId}`, { content });
    return res.data;
  },

  delete: async (noteId: number): Promise<void> => {
    await api.delete(`/customers/notes/${noteId}`);
  },
};
