import api from './api';

export interface TicketTrend {
  date: string;
  count: number;
}

export interface ActivityFeedItem {
  id: number;
  customerId: number;
  type: string;
  entityId: number;
  description: string;
  createdAt: string;
  performedBy?: {
    id: number;
    name: string;
  };
}

export interface DashboardSummary {
  totalCustomers: number;
  activeCustomers: number;
  openTickets: number;
  criticalTickets: number;
  todayTicketsCount: number;
  newCustomersThisMonth: number;
  avgResolutionTimeHours: number;
  resolutionRate: number;
  ticketStatusDistribution: Record<string, number>;
  customerStatusDistribution: Record<string, number>;
  ticketPriorityDistribution: Record<string, number>;
  ticketTrendLast30Days: TicketTrend[];
  recentActivities: ActivityFeedItem[];
}

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await api.get('/api/dashboard/summary');
    return response.data;
  }
};
