import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../services/dashboard';
import { customerApi } from '../../services/customer';
import { ticketApi } from '../../services/ticket';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Users, UserCheck, Ticket as TicketIcon, AlertTriangle, Loader2, Plus, Search } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useNavigate } from 'react-router';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';

const TICKET_STATUS_COLORS: Record<string, string> = {
  OPEN: '#f59e0b',
  IN_PROGRESS: '#3b82f6',
  RESOLVED: '#10b981',
  CLOSED: '#6b7280',
};

const CUSTOMER_STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#10b981',
  INACTIVE: '#f59e0b',
  BLOCKED: '#ef4444',
};

export default function DashboardPage() {
  const navigate = useNavigate();

  const { data: summary, isLoading: isSummaryLoading, error: summaryError } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: dashboardApi.getSummary,
  });

  const { data: recentCustomers, isLoading: isCustomersLoading } = useQuery({
    queryKey: ['recentCustomers'],
    queryFn: () => customerApi.getAll(0, 5),
  });

  const { data: recentTickets, isLoading: isTicketsLoading } = useQuery({
    queryKey: ['recentTickets'],
    queryFn: () => ticketApi.getAll(0, 5),
  });

  const { data: pendingTickets, isLoading: isPendingTicketsLoading } = useQuery({
    queryKey: ['pendingTickets'],
    queryFn: () => ticketApi.getAll(0, 5, 'OPEN', 'ALL'),
  });

  if (isSummaryLoading || isCustomersLoading || isTicketsLoading || isPendingTicketsLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Genel bakış yükleniyor...</span>
      </div>
    );
  }

  if (summaryError || !summary) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg border border-red-200">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-500" />
        Veriler yüklenemedi. Lütfen tekrar deneyin.
      </div>
    );
  }

  const statCards = [
    {
      title: 'Toplam Müşteri',
      value: summary.totalCustomers,
      icon: Users,
      color: 'text-blue-600',
      path: '/customers'
    },
    {
      title: 'Aktif Müşteri',
      value: summary.activeCustomers,
      icon: UserCheck,
      color: 'text-emerald-600',
      path: '/customers'
    },
    {
      title: 'Açık Talep',
      value: summary.openTickets,
      icon: TicketIcon,
      color: 'text-amber-600',
      path: '/tickets'
    },
    {
      title: 'Kritik Talep',
      value: summary.criticalTickets,
      icon: AlertTriangle,
      color: 'text-red-600',
      path: '/tickets'
    },
  ];

  // Prepare chart data with translated names
  const translateTicketStatus = (status: string) => {
    switch (status) {
      case 'OPEN': return 'AÇIK';
      case 'IN_PROGRESS': return 'İŞLEMDE';
      case 'RESOLVED': return 'ÇÖZÜLDÜ';
      case 'CLOSED': return 'KAPALI';
      default: return status;
    }
  };

  const translateCustomerStatus = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'AKTİF';
      case 'INACTIVE': return 'PASİF';
      case 'BLOCKED': return 'ENGELLİ';
      default: return status;
    }
  };

  const ticketChartData = summary.ticketStatusDistribution
    ? Object.entries(summary.ticketStatusDistribution).map(([key, value]) => ({
        originalName: key,
        name: translateTicketStatus(key),
        value,
      }))
    : [];

  const customerChartData = summary.customerStatusDistribution
    ? Object.entries(summary.customerStatusDistribution).map(([key, value]) => ({
        originalName: key,
        name: translateCustomerStatus(key),
        value,
      }))
    : [];

  const getPriorityBadgeTr = (priority: string) => {
    switch(priority) {
      case 'LOW': return 'DÜŞÜK';
      case 'MEDIUM': return 'ORTA';
      case 'HIGH': return 'YÜKSEK';
      case 'CRITICAL': return 'KRİTİK';
      default: return priority;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Genel Bakış</h2>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate('/customers/new')} size="sm">
            <Plus className="h-4 w-4 mr-2" /> Yeni Müşteri
          </Button>
          <Button onClick={() => navigate('/customers')} variant="secondary" size="sm">
            <Search className="h-4 w-4 mr-2" /> Müşteri Ara
          </Button>
          <Button onClick={() => navigate('/tickets')} variant="outline" size="sm">
            <TicketIcon className="h-4 w-4 mr-2" /> Tüm Talepler
          </Button>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card 
            key={index} 
            className="border shadow-sm cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
            onClick={() => navigate(stat.path)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">Talep Durum Dağılımı</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {ticketChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ticketChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {ticketChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={TICKET_STATUS_COLORS[entry.originalName] || '#9ca3af'} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">Veri bulunamadı</div>
            )}
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">Müşteri Durum Dağılımı</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
             {customerChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={customerChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                    <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {customerChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CUSTOMER_STATUS_COLORS[entry.originalName] || '#9ca3af'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
             ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">Veri bulunamadı</div>
             )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Tickets Section */}
      <Card className="border shadow-sm overflow-hidden border-orange-200">
        <CardHeader className="bg-orange-50/50">
          <CardTitle className="text-lg text-orange-900 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
            İşlem Bekleyen Talepler
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pendingTickets?.content && pendingTickets.content.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Talep</TableHead>
                  <TableHead>Konu</TableHead>
                  <TableHead>Öncelik</TableHead>
                  <TableHead>Müşteri</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingTickets.content.map((ticket) => (
                  <TableRow 
                    key={ticket.id} 
                    className="cursor-pointer hover:bg-orange-50/30"
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                  >
                    <TableCell className="font-medium text-slate-900">
                      {ticket.ticketNumber}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {ticket.subject}
                    </TableCell>
                    <TableCell>
                      <Badge 
                         variant="outline"
                         className={
                           ticket.priority === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' :
                           ticket.priority === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                           ticket.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                           'bg-blue-50 text-blue-700 border-blue-200'
                         }
                      >
                        {getPriorityBadgeTr(ticket.priority)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {ticket.customer.firstName} {ticket.customer.lastName}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-6 text-center text-sm text-slate-500">
              İşlem bekleyen talep bulunmuyor. Harika!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Lists Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50">
            <CardTitle className="text-lg text-slate-900">Son Eklenen Müşteriler</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentCustomers?.content && recentCustomers.content.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Müşteri</TableHead>
                    <TableHead>Şirket</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Oluşturulma</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCustomers.content.map((customer) => (
                    <TableRow 
                      key={customer.id} 
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => navigate(`/customers/${customer.id}`)}
                    >
                      <TableCell className="font-medium text-slate-900">
                        {customer.firstName} {customer.lastName}
                      </TableCell>
                      <TableCell>{customer.company}</TableCell>
                      <TableCell>
                        <Badge 
                           variant="outline" 
                           className={
                             customer.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                             customer.status === 'INACTIVE' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                             'bg-red-50 text-red-700 border-red-200'
                           }
                        >
                          {translateCustomerStatus(customer.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {format(new Date(customer.createdAt), 'dd MMM yyyy', { locale: tr })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-6 text-center text-sm text-slate-500">
                Henüz müşteri bulunmuyor.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50">
            <CardTitle className="text-lg text-slate-900">Son Destek Talepleri</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentTickets?.content && recentTickets.content.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Talep</TableHead>
                    <TableHead>Konu</TableHead>
                    <TableHead>Öncelik</TableHead>
                    <TableHead>Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTickets.content.map((ticket) => (
                    <TableRow 
                      key={ticket.id} 
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                    >
                      <TableCell className="font-medium text-slate-900">
                        {ticket.ticketNumber}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {ticket.subject}
                      </TableCell>
                      <TableCell>
                        <Badge 
                           variant="outline"
                           className={
                             ticket.priority === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' :
                             ticket.priority === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                             ticket.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                             'bg-blue-50 text-blue-700 border-blue-200'
                           }
                        >
                          {getPriorityBadgeTr(ticket.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                           variant="outline"
                           className={
                             ticket.status === 'OPEN' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                             ticket.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                             ticket.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                             'bg-slate-100 text-slate-700 border-slate-200'
                           }
                        >
                          {translateTicketStatus(ticket.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-6 text-center text-sm text-slate-500">
                Henüz talep bulunmuyor.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
