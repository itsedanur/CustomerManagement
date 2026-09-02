import api from './api';

export interface TicketNote {
  id: number;
  ticketId: number;
  authorUserId: number;
  authorName: string;
  authorEmail: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export const ticketNoteApi = {
  getByTicketId: async (ticketId: number): Promise<TicketNote[]> => {
    const res = await api.get<TicketNote[]>(`/tickets/${ticketId}/notes`);
    return res.data;
  },

  create: async (ticketId: number, content: string): Promise<TicketNote> => {
    const res = await api.post<TicketNote>(`/tickets/${ticketId}/notes`, { content });
    return res.data;
  },

  update: async (noteId: number, content: string): Promise<TicketNote> => {
    const res = await api.put<TicketNote>(`/tickets/notes/${noteId}`, { content });
    return res.data;
  },

  delete: async (noteId: number): Promise<void> => {
    await api.delete(`/tickets/notes/${noteId}`);
  },
};
