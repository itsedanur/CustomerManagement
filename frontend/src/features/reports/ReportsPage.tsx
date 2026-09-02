import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportApi } from '../../services/report';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import {
  Users,
  Ticket,
  Clock,
  TrendingUp,
  Award
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { mapCustomerStatus, mapCustomerType, mapTicketStatus, mapTicketPriority } from '../../utils/enum-mapper';
import { UserAvatar } from '../../components/ui/user-avatar';
import { TableSkeleton } from '../../components/ui/skeletons';

const COLOR_PALETTE = ['#0f172a', '#0284c7', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

export default function ReportsPage() {
  const [range, setRange] = useState<'7D' | '30D' | '3M' | '6M' | 'ALL'>('30D');

  const getDateRangeParams = () => {
    const now = new Date();
    let start: Date | null = null;

    if (range === '7D') {
      start = new Date(now.setDate(now.getDate() - 7));
    } else if (range === '30D') {
      start = new Date(now.setDate(now.getDate() - 30));
    } else if (range === '3M') {
      start = new Date(now.setMonth(now.getMonth() - 3));
    } else if (range === '6M') {
      start = new Date(now.setMonth(now.getMonth() - 6));
    }

    return {
      startDate: start ? start.toISOString() : undefined,
      endDate: undefined,
    };
  };

  const params = getDateRangeParams();

  // Queries
  const { data: customerAnalytics } = useQuery({
    queryKey: ['reports', 'customer-analytics', range],
    queryFn: () => reportApi.getCustomerAnalytics(params.startDate, params.endDate),
  });

  const { data: ticketAnalytics } = useQuery({
    queryKey: ['reports', 'ticket-analytics', range],
    queryFn: () => reportApi.getTicketAnalytics(params.startDate, params.endDate),
  });

  const { data: repPerformance = [], isLoading: loadingRep } = useQuery({
    queryKey: ['reports', 'representative-performance', range],
    queryFn: () => reportApi.getRepresentativePerformance(params.startDate, params.endDate),
  });

  // Prepare chart data
  const customerStatusData = customerAnalytics
    ? Object.entries(customerAnalytics.statusDistribution).map(([key, value]) => ({
        name: mapCustomerStatus(key).label,
        val: value,
      }))
    : [];

  const customerTypeData = customerAnalytics
    ? Object.entries(customerAnalytics.typeDistribution).map(([key, value]) => ({
        name: mapCustomerType(key),
        val: value,
      }))
    : [];

  const customerMonthlyData = customerAnalytics
    ? Object.entries(customerAnalytics.monthlyTrend).map(([key, value]) => ({
        month: key,
        müşteriler: value,
      }))
    : [];

  const ticketStatusData = ticketAnalytics
    ? Object.entries(ticketAnalytics.statusDistribution).map(([key, value]) => ({
        name: mapTicketStatus(key).label,
        val: value,
      }))
    : [];

  const ticketPriorityData = ticketAnalytics
    ? Object.entries(ticketAnalytics.priorityDistribution).map(([key, value]) => ({
        name: mapTicketPriority(key).label,
        val: value,
      }))
    : [];

  const ticketDailyData = ticketAnalytics
    ? Object.entries(ticketAnalytics.dailyTrend).map(([key, value]) => ({
        day: key,
        talepler: value,
      }))
    : [];

  return (
    <div className="space-y-8">
      {/* Header & Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">CRM Rapor ve Analitikler</h1>
          <p className="text-xs text-slate-500 mt-1">Müşteri büyümesi, destek performansı ve temsilci operasyon metrikleri.</p>
        </div>

        {/* Range Selector */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs text-xs">
          {(['7D', '30D', '3M', '6M', 'ALL'] as const).map((r) => (
            <Button
              key={r}
              size="sm"
              variant={range === r ? 'default' : 'ghost'}
              onClick={() => setRange(r)}
              className={`h-7 px-2.5 text-xs ${range === r ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {r === '7D' && 'Son 7 Gün'}
              {r === '30D' && 'Son 30 Gün'}
              {r === '3M' && 'Son 3 Ay'}
              {r === '6M' && 'Son 6 Ay'}
              {r === 'ALL' && 'Tüm Zamanlar'}
            </Button>
          ))}
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200/80 shadow-2xs bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Toplam Müşteri</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{customerAnalytics?.totalCustomers || 0}</h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-2xs bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Toplam Talep</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{ticketAnalytics?.totalTickets || 0}</h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Ticket className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-2xs bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ort. Çözüm Süresi</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{ticketAnalytics?.avgResolutionTimeHours || 0} <span className="text-xs font-normal text-slate-500">saat</span></h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-2xs bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Çözüm Oranı</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">%{ticketAnalytics?.resolutionRatePercentage || 0}</h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Analytics Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-700" />
          <h2 className="text-base font-bold text-slate-900">Müşteri Analitiği</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Monthly Customer Growth Chart */}
          <Card className="lg:col-span-2 border border-slate-200/80 shadow-2xs bg-white">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold text-slate-900">Son 6 Ay Yeni Müşteri Trendi</CardTitle>
              <CardDescription className="text-xs text-slate-500">Aylara göre sisteme katılan yeni müşteri sayısı.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={customerMonthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="müşteriler" fill="#0f172a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Customer Distribution Pie Charts */}
          <Card className="border border-slate-200/80 shadow-2xs bg-white">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold text-slate-900">Müşteri Dağılımı</CardTitle>
              <CardDescription className="text-xs text-slate-500">Durum ve tip bazlı müşteri oranları.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 mb-2">Durum Dağılımı</p>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={customerStatusData} dataKey="val" nameKey="name" cx="50%" cy="50%" innerRadius={25} outerRadius={45}>
                        {customerStatusData.map((_, idx) => (
                          <Cell key={idx} fill={COLOR_PALETTE[idx % COLOR_PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <p className="text-[11px] font-semibold text-slate-500 mb-2">Müşteri Tipi Dağılımı</p>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={customerTypeData} dataKey="val" nameKey="name" cx="50%" cy="50%" innerRadius={25} outerRadius={45}>
                        {customerTypeData.map((_, idx) => (
                          <Cell key={idx} fill={COLOR_PALETTE[(idx + 2) % COLOR_PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Ticket Analytics Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Ticket className="h-4 w-4 text-slate-700" />
          <h2 className="text-base font-bold text-slate-900">Destek Talebi Analitiği</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Daily Ticket Trend */}
          <Card className="lg:col-span-2 border border-slate-200/80 shadow-2xs bg-white">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold text-slate-900">Son 30 Günlük Talep Hacmi</CardTitle>
              <CardDescription className="text-xs text-slate-500">Günlük açılan destek taleplerinin dağılımı.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ticketDailyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="talepler" stroke="#0284c7" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Ticket Status & Priority Breakdown */}
          <Card className="border border-slate-200/80 shadow-2xs bg-white">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold text-slate-900">Öncelik & Durum Dağılımı</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 mb-2">Talep Durumu</p>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={ticketStatusData} dataKey="val" nameKey="name" cx="50%" cy="50%" innerRadius={25} outerRadius={45}>
                        {ticketStatusData.map((_, idx) => (
                          <Cell key={idx} fill={COLOR_PALETTE[idx % COLOR_PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <p className="text-[11px] font-semibold text-slate-500 mb-2">Öncelik Seviyesi</p>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={ticketPriorityData} dataKey="val" nameKey="name" cx="50%" cy="50%" innerRadius={25} outerRadius={45}>
                        {ticketPriorityData.map((_, idx) => (
                          <Cell key={idx} fill={COLOR_PALETTE[(idx + 1) % COLOR_PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Representative Performance Table */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-slate-700" />
          <h2 className="text-base font-bold text-slate-900">Temsilci Operasyonel Performansı</h2>
        </div>

        <Card className="border border-slate-200/80 shadow-2xs bg-white overflow-hidden">
          {loadingRep ? (
            <TableSkeleton />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="crm-table-header">
                    <TableHead>Temsilci Kullanıcı</TableHead>
                    <TableHead>E-Posta</TableHead>
                    <TableHead className="text-center">Atanan Talep</TableHead>
                    <TableHead className="text-center">Açık Talep</TableHead>
                    <TableHead className="text-center">Çözülen Talep</TableHead>
                    <TableHead className="text-center">Ort. Çözüm Süresi</TableHead>
                    <TableHead className="text-center">Aktif Görevler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {repPerformance.map((rep) => (
                    <TableRow key={rep.userId} className="hover:bg-slate-50/80 crm-transition text-xs">
                      <TableCell className="font-semibold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar name={rep.userName} size="sm" />
                          <span>{rep.userName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 font-mono text-[11px]">{rep.userEmail}</TableCell>
                      <TableCell className="text-center font-semibold text-slate-900">{rep.totalAssignedTickets}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-bold">
                          {rep.openTickets}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">
                          {rep.resolvedTickets}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-slate-700 font-medium">
                        {rep.avgResolutionTimeHours > 0 ? `${rep.avgResolutionTimeHours} saat` : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-bold">
                          {rep.activeTasks} görev
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
