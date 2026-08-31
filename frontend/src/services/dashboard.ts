import api from './api';

export interface DashboardSummary {
  totalCustomers: number;
  activeCustomers: number;
  openTickets: number;
  criticalTickets: number;
  ticketStatusDistribution: Record<string, number>;
  customerStatusDistribution: Record<string, number>;
}

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await api.get('/api/dashboard/summary');
    return response.data;
  }
};
