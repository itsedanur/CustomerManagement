import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../services/dashboard';
import { ticketApi } from '../../services/ticket';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Users, Ticket as TicketIcon, AlertTriangle, CheckCircle2, Clock, Activity, ArrowRight, UserCheck } from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { useNavigate } from 'react-router';
import { DashboardSkeleton } from '../../components/ui/skeletons';
import { PriorityBadge } from '../../components/ui/priority-badge';
import { UserAvatar } from '../../components/ui/user-avatar';
import { mapTicketStatus, mapCustomerStatus } from '../../utils/enum-mapper';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function DashboardPage() {
  const navigate = useNavigate();

  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: dashboardApi.getSummary,
  });

  const { data: pendingTicketsData } = useQuery({
    queryKey: ['pendingTickets'],
    queryFn: () => ticketApi.getAll(0, 5, 'OPEN'),
  });

  if (isSummaryLoading) {
    return <DashboardSkeleton />;
  }

  // Format Status Distribution for Charts
  const ticketStatusData = summary?.ticketStatusDistribution
    ? Object.entries(summary.ticketStatusDistribution).map(([status, count]) => ({
        name: mapTicketStatus(status).label,
        value: count,
        key: status
      }))
    : [];

  const customerStatusData = summary?.customerStatusDistribution
    ? Object.entries(summary.customerStatusDistribution).map(([status, count]) => ({
        name: mapCustomerStatus(status).label,
        value: count,
        key: status
      }))
    : [];

  const priorityData = summary?.ticketPriorityDistribution
    ? [
        { name: 'Düşük', value: summary.ticketPriorityDistribution['LOW'] || 0, color: '#64748b' },
        { name: 'Normal', value: summary.ticketPriorityDistribution['MEDIUM'] || 0, color: '#3b82f6' },
        { name: 'Yüksek', value: summary.ticketPriorityDistribution['HIGH'] || 0, color: '#f59e0b' },
        { name: 'Kritik', value: summary.ticketPriorityDistribution['CRITICAL'] || 0, color: '#f43f5e' },
      ]
    : [];

  const STATUS_COLORS: Record<string, string> = {
    OPEN: '#f59e0b',
    IN_PROGRESS: '#0284c7',
    RESOLVED: '#10b981',
    CLOSED: '#64748b',
    ACTIVE: '#10b981',
    INACTIVE: '#64748b',
    BLOCKED: '#f43f5e'
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="crm-page-title">Genel Bakış</h1>
          <p className="crm-secondary-text mt-1">Müşteri ilişkileri, açık destek talepleri ve günlük operasyonel göstergeler</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/customers/new')} className="h-9 text-xs">
            + Yeni Müşteri
          </Button>
          <Button size="sm" onClick={() => navigate('/tickets')} className="h-9 text-xs bg-slate-900 hover:bg-slate-800 text-white">
            Tüm Talepler
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200/80 shadow-xs hover:border-slate-300 crm-transition bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Toplam Müşteri</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{summary?.totalCustomers || 0}</h3>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs border-t border-slate-100 pt-3">
              <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                Bu ay +{summary?.newCustomersThisMonth || 0} yeni
              </span>
              <span className="text-slate-500">Aktif: {summary?.activeCustomers || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-xs hover:border-slate-300 crm-transition bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Açık Talepler</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{summary?.openTickets || 0}</h3>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <TicketIcon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs border-t border-slate-100 pt-3">
              <span className="text-slate-600">Bugün açılan: <strong className="text-slate-900">{summary?.todayTicketsCount || 0}</strong></span>
              <span className="text-amber-700 font-medium">İşlem bekleniyor</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-xs hover:border-slate-300 crm-transition bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kritik Talepler</p>
                <h3 className="text-2xl font-bold text-rose-600 mt-1">{summary?.criticalTickets || 0}</h3>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs border-t border-slate-100 pt-3">
              <span className="text-rose-700 font-medium bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60">
                Acil müdahale
              </span>
              <span className="text-slate-500">Yüksek öncelik</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-xs hover:border-slate-300 crm-transition bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ort. Çözüm Süresi</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{summary?.avgResolutionTimeHours || 4.2} saat</h3>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs border-t border-slate-100 pt-3">
              <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> %{summary?.resolutionRate || 92.5} Çözüm
              </span>
              <span className="text-slate-500">Hedef: &lt; 8 saat</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 30-Day Ticket Trend Chart & Priority Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border border-slate-200/80 shadow-xs bg-white">
          <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/40">
            <CardTitle className="text-sm font-semibold text-slate-900">Son 30 Günlük Talep Trendi</CardTitle>
            <CardDescription className="text-xs text-slate-500">Günlük bazda oluşturulan müşteri destek talepleri akışı</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary?.ticketTrendLast30Days || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ticketTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e2e8f0' }} />
                  <Area type="monotone" dataKey="count" name="Talep Sayısı" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#ticketTrendGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution Chart */}
        <Card className="border border-slate-200/80 shadow-xs bg-white">
          <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/40">
            <CardTitle className="text-sm font-semibold text-slate-900">Talep Öncelik Dağılımı</CardTitle>
            <CardDescription className="text-xs text-slate-500">Öncelik seviyelerine göre talep kırılımı</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="value" name="Talep Sayısı" radius={[4, 4, 0, 0]}>
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operational Split: Pending Tickets & System Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* İşlem Bekleyen Talepler (Pending Tickets Table) */}
        <Card className="lg:col-span-2 border border-slate-200/80 shadow-xs bg-white">
          <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/40 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900">İşlem Bekleyen Talepler</CardTitle>
              <CardDescription className="text-xs text-slate-500">Müdahale bekleyen son açık destek talepleri</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/tickets')} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium gap-1">
              Tümünü Gör <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="crm-table-header border-b border-slate-100">
                    <th className="p-3 pl-4">Talep NO</th>
                    <th className="p-3">Konu</th>
                    <th className="p-3">Müşteri</th>
                    <th className="p-3">Öncelik</th>
                    <th className="p-3">Temsilci</th>
                    <th className="p-3 text-right pr-4">Aksiyon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingTicketsData?.content?.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-slate-50/80 crm-transition">
                      <td className="p-3 pl-4 font-mono font-semibold text-slate-900">{ticket.ticketNumber}</td>
                      <td className="p-3 max-w-xs truncate font-medium text-slate-800" title={ticket.subject}>
                        {ticket.subject}
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-900">{ticket.customer.firstName} {ticket.customer.lastName}</span>
                      </td>
                      <td className="p-3">
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td className="p-3 text-slate-600">
                        {ticket.assignedUserId ? (
                          <span className="flex items-center gap-1.5 font-medium text-slate-700">
                            <UserCheck className="h-3.5 w-3.5 text-indigo-600" /> Atandı
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">Atanmadı</span>
                        )}
                      </td>
                      <td className="p-3 pr-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/tickets/${ticket.id}`)}
                          className="h-7 text-[11px] px-2.5"
                        >
                          İncele
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Son Sistem Aktiviteleri Feed */}
        <Card className="border border-slate-200/80 shadow-xs bg-white">
          <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/40">
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-600" /> Son Sistem Aktiviteleri
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">Müşteri ve destek işlemlerinin canlı takibi</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              {summary?.recentActivities?.slice(0, 6).map((act) => (
                <div key={act.id} className="flex items-start gap-3 text-xs">
                  <UserAvatar name={act.performedBy?.name || 'Sistem'} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 font-medium line-clamp-2">{act.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      <span>{act.performedBy?.name || 'Sistem'}</span>
                      <span>•</span>
                      <span>{format(new Date(act.createdAt), 'dd MMM, HH:mm', { locale: tr })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-slate-200/80 shadow-xs bg-white">
          <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/40">
            <CardTitle className="text-sm font-semibold text-slate-900">Talep Durum Dağılımı</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ticketStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {ticketStatusData.map((entry) => (
                      <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-xs bg-white">
          <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/40">
            <CardTitle className="text-sm font-semibold text-slate-900">Müşteri Durum Dağılımı</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={customerStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {customerStatusData.map((entry) => (
                      <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
