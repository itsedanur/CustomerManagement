import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../services/dashboard';
import { customerApi } from '../../services/customer';
import { ticketApi } from '../../services/ticket';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Users, UserCheck, Ticket as TicketIcon, AlertCircle, Plus, Search, ArrowRight, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useNavigate } from 'react-router';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { StatusBadge } from '../../components/ui/status-badge';
import { PriorityBadge } from '../../components/ui/priority-badge';
import { DashboardSkeleton } from '../../components/ui/skeletons';
import { EmptyState } from '../../components/ui/empty-state';

const TICKET_STATUS_COLORS: Record<string, string> = {
  OPEN: '#f59e0b',
  IN_PROGRESS: '#0284c7',
  RESOLVED: '#10b981',
  CLOSED: '#64748b',
};

const CUSTOMER_STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#10b981',
  INACTIVE: '#f59e0b',
  SUSPENDED: '#rose-500',
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
    return <DashboardSkeleton />;
  }

  if (summaryError || !summary) {
    return (
      <div className="p-8 text-center text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
        <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-rose-500" />
        <h3 className="font-semibold text-base mb-1">Veriler yüklenirken bir sorun oluştu.</h3>
        <p className="text-xs text-rose-500 mb-4">Sunucu ile bağlantı kurulamadı veya zaman aşımına uğradı.</p>
        <Button size="sm" onClick={() => window.location.reload()} variant="outline" className="bg-white text-rose-700 border-rose-300">
          Tekrar Dene
        </Button>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Toplam Müşteri',
      value: summary.totalCustomers,
      icon: Users,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      path: '/customers',
      subtitle: 'Sistemde kayıtlı portföy'
    },
    {
      title: 'Aktif Müşteri',
      value: summary.activeCustomers,
      icon: UserCheck,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      path: '/customers',
      subtitle: 'Etkileşimi devam eden'
    },
    {
      title: 'Açık Talep',
      value: summary.openTickets,
      icon: TicketIcon,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
      path: '/tickets',
      subtitle: 'Yanıt bekleyen talepler'
    },
    {
      title: 'Kritik Talep',
      value: summary.criticalTickets,
      icon: AlertCircle,
      color: 'text-rose-600 bg-rose-50 border-rose-100',
      path: '/tickets',
      subtitle: 'Acil müdahale gerektiren'
    },
  ];

  const translateTicketStatus = (status: string) => {
    switch (status) {
      case 'OPEN': return 'Açık';
      case 'IN_PROGRESS': return 'İşlemde';
      case 'RESOLVED': return 'Çözüldü';
      case 'CLOSED': return 'Kapalı';
      default: return status;
    }
  };

  const translateCustomerStatus = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Aktif';
      case 'INACTIVE': return 'Pasif';
      case 'SUSPENDED': return 'Engelli';
      default: return status;
    }
  };

  const ticketChartData = summary.ticketStatusDistribution
    ? Object.entries(summary.ticketStatusDistribution).map(([key, value]) => ({
        originalName: key,
        name: translateTicketStatus(key),
        Adet: value,
      }))
    : [];

  const customerChartData = summary.customerStatusDistribution
    ? Object.entries(summary.customerStatusDistribution).map(([key, value]) => ({
        originalName: key,
        name: translateCustomerStatus(key),
        Adet: value,
      }))
    : [];

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="crm-page-title">Genel Bakış</h1>
          <p className="crm-secondary-text mt-1">Sistem genelindeki müşteri ve destek talebi göstergeleri</p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button onClick={() => navigate('/customers/new')} size="sm" className="bg-slate-900 text-white hover:bg-slate-800 text-xs h-8">
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Yeni Müşteri
          </Button>
          <Button onClick={() => navigate('/customers')} variant="outline" size="sm" className="text-xs h-8">
            <Search className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Müşteri Ara
          </Button>
          <Button onClick={() => navigate('/tickets')} variant="outline" size="sm" className="text-xs h-8">
            <TicketIcon className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Tüm Talepler
          </Button>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card 
            key={index} 
            className="border border-slate-200/80 shadow-xs bg-white crm-card-hover cursor-pointer overflow-hidden"
            onClick={() => navigate(stat.path)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="crm-card-title">{stat.title}</span>
              <div className={`p-2 rounded-lg border ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</div>
              <p className="text-[11px] text-slate-400 mt-1">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Required Tickets Section */}
      <Card className="border border-amber-200/80 shadow-xs bg-white overflow-hidden">
        <CardHeader className="bg-amber-50/40 border-b border-amber-100 py-3.5 px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-amber-900 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              İşlem Bekleyen Talepler
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/tickets')}
              className="text-xs text-amber-800 hover:text-amber-950 hover:bg-amber-100/50 h-7 px-2"
            >
              Tümünü Gör <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {pendingTickets?.content && pendingTickets.content.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="crm-table-header">
                  <TableHead className="w-32">Talep No</TableHead>
                  <TableHead>Konu</TableHead>
                  <TableHead className="w-28">Öncelik</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead className="w-24 text-right">Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingTickets.content.map((ticket) => (
                  <TableRow 
                    key={ticket.id} 
                    className="cursor-pointer hover:bg-slate-50/80 crm-transition"
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                  >
                    <TableCell className="font-semibold text-xs text-slate-900">
                      {ticket.ticketNumber}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-slate-800 font-medium">
                      {ticket.subject}
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={ticket.priority} />
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {ticket.customer.firstName} {ticket.customer.lastName}
                    </TableCell>
                    <TableCell className="text-right">
                      <StatusBadge status={ticket.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              title="İşlem bekleyen talep bulunmuyor"
              description="Açık durumda yanıt veya aksiyon bekleyen herhangi bir destek talebi mevcut değil."
            />
          )}
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border border-slate-200/80 shadow-xs bg-white">
          <CardHeader className="border-b border-slate-100 py-3.5 px-5">
            <CardTitle className="text-sm font-semibold text-slate-900">Talep Durum Dağılımı</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px] p-4">
            {ticketChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ticketChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="Adet"
                  >
                    {ticketChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={TICKET_STATUS_COLORS[entry.originalName] || '#9ca3af'} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="Veri Yok" description="Henüz oluşturulmuş talep verisi bulunmuyor." />
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-xs bg-white">
          <CardHeader className="border-b border-slate-100 py-3.5 px-5">
            <CardTitle className="text-sm font-semibold text-slate-900">Müşteri Durum Dağılımı</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px] p-4">
             {customerChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={customerChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <RechartsTooltip cursor={{ fill: 'rgba(241,245,249,0.6)' }} />
                    <Bar dataKey="Adet" radius={[4, 4, 0, 0]} barSize={36}>
                      {customerChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CUSTOMER_STATUS_COLORS[entry.originalName] || '#9ca3af'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
             ) : (
                <EmptyState title="Veri Yok" description="Henüz kayıtlı müşteri verisi bulunmuyor." />
             )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Lists Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Customers */}
        <Card className="border border-slate-200/80 shadow-xs bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-100 py-3.5 px-5 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-900">Son Eklenen Müşteriler</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/customers')} className="text-xs text-slate-500 hover:text-slate-900 h-7 px-2">
              Tümü <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentCustomers?.content && recentCustomers.content.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="crm-table-header">
                    <TableHead>Müşteri</TableHead>
                    <TableHead>Şirket</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">Tarih</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCustomers.content.map((customer) => (
                    <TableRow 
                      key={customer.id} 
                      className="cursor-pointer hover:bg-slate-50/80 crm-transition"
                      onClick={() => navigate(`/customers/${customer.id}`)}
                    >
                      <TableCell className="font-semibold text-xs text-slate-900">
                        {customer.firstName} {customer.lastName}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{customer.company || '-'}</TableCell>
                      <TableCell>
                        <StatusBadge status={customer.status} />
                      </TableCell>
                      <TableCell className="text-right text-xs text-slate-500">
                        {format(new Date(customer.createdAt), 'dd MMM yyyy', { locale: tr })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState title="Henüz müşteri bulunmuyor" description="Sistemde henüz kayıtlı müşteri yok." />
            )}
          </CardContent>
        </Card>

        {/* Recent Tickets */}
        <Card className="border border-slate-200/80 shadow-xs bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-100 py-3.5 px-5 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-900">Son Destek Talepleri</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/tickets')} className="text-xs text-slate-500 hover:text-slate-900 h-7 px-2">
              Tümü <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentTickets?.content && recentTickets.content.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="crm-table-header">
                    <TableHead>Talep</TableHead>
                    <TableHead>Konu</TableHead>
                    <TableHead>Öncelik</TableHead>
                    <TableHead className="text-right">Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTickets.content.map((ticket) => (
                    <TableRow 
                      key={ticket.id} 
                      className="cursor-pointer hover:bg-slate-50/80 crm-transition"
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                    >
                      <TableCell className="font-semibold text-xs text-slate-900">
                        {ticket.ticketNumber}
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate text-xs text-slate-700">
                        {ticket.subject}
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={ticket.priority} />
                      </TableCell>
                      <TableCell className="text-right">
                        <StatusBadge status={ticket.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState title="Henüz talep bulunmuyor" description="Sistemde oluşturulmuş destek talebi yok." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
