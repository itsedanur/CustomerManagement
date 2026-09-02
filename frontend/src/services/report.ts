import api from './api';

export interface CustomerAnalytics {
  totalCustomers: number;
  statusDistribution: Record<string, number>;
  typeDistribution: Record<string, number>;
  monthlyTrend: Record<string, number>;
}

export interface TicketAnalytics {
  totalTickets: number;
  statusDistribution: Record<string, number>;
  priorityDistribution: Record<string, number>;
  dailyTrend: Record<string, number>;
  avgResolutionTimeHours: number;
  resolutionRatePercentage: number;
}

export interface RepresentativePerformance {
  userId: number;
  userName: string;
  userEmail: string;
  role: string;
  totalAssignedTickets: number;
  openTickets: number;
  resolvedTickets: number;
  avgResolutionTimeHours: number;
  activeTasks: number;
}

export const reportApi = {
  getCustomerAnalytics: async (startDate?: string, endDate?: string): Promise<CustomerAnalytics> => {
    const res = await api.get<CustomerAnalytics>('/api/reports/customer-analytics', { params: { startDate, endDate } });
    return res.data;
  },

  getTicketAnalytics: async (startDate?: string, endDate?: string): Promise<TicketAnalytics> => {
    const res = await api.get<TicketAnalytics>('/api/reports/ticket-analytics', { params: { startDate, endDate } });
    return res.data;
  },

  getRepresentativePerformance: async (startDate?: string, endDate?: string): Promise<RepresentativePerformance[]> => {
    const res = await api.get<RepresentativePerformance[]>('/api/reports/representative-performance', { params: { startDate, endDate } });
    return Array.isArray(res.data) ? res.data : [];
  },
};
