import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ticketApi } from '../../services/ticket';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { Eye, Search, Filter, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { StatusBadge } from '../../components/ui/status-badge';
import { PriorityBadge } from '../../components/ui/priority-badge';
import { TableSkeleton } from '../../components/ui/skeletons';
import { EmptyState } from '../../components/ui/empty-state';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

import { FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

export default function TicketListPage() {
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState('ALL');
  const [priority, setPriority] = useState('ALL');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (status !== 'ALL') params.append('status', status);
    if (priority !== 'ALL') params.append('priority', priority);
    if (search) params.append('search', search);

    const token = localStorage.getItem('token');
    fetch(`/api/tickets/export/csv?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'destek_talepleri.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success('Destek talepleri CSV olarak indirildi');
      })
      .catch(() => toast.error('CSV indirme başarısız'));
  };

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', page, status, priority, search],
    queryFn: () => ticketApi.getAll(page, 10, status, priority, search),
  });

  const handleReset = () => {
    setStatus('ALL');
    setPriority('ALL');
    setSearch('');
    setPage(0);
  };

  const filteredTickets = data?.content || [];

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="crm-page-title">Destek Talepleri</h1>
          <p className="crm-secondary-text mt-1">Müşterilerden gelen tüm teknik ve operasyonel destek biletleri</p>
        </div>
        <Button variant="outline" onClick={handleExportCsv} className="h-9 text-xs gap-1.5 border-slate-300">
          <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> CSV'ye Aktar
        </Button>
      </div>

      {/* Toolbar / Filters */}
      <Card className="border border-slate-200/80 shadow-xs bg-white">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-1 flex-col sm:flex-row items-center gap-3 w-full">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Talep NO, konu veya müşteri ara..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                  className="pl-9 h-9 text-xs"
                />
              </div>

              {/* Status Filter */}
              <div className="w-full sm:w-44">
                <Select value={status} onValueChange={(val) => { setStatus(val || 'ALL'); setPage(0); }}>
                  <SelectTrigger className="h-9 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Filter className="h-3.5 w-3.5 text-slate-400" />
                      <SelectValue placeholder="Durum Filtresi" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tüm Durumlar</SelectItem>
                    <SelectItem value="OPEN">Açık</SelectItem>
                    <SelectItem value="IN_PROGRESS">İşlemde</SelectItem>
                    <SelectItem value="RESOLVED">Çözüldü</SelectItem>
                    <SelectItem value="CLOSED">Kapalı</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority Filter */}
              <div className="w-full sm:w-44">
                <Select value={priority} onValueChange={(val) => { setPriority(val || 'ALL'); setPage(0); }}>
                  <SelectTrigger className="h-9 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Filter className="h-3.5 w-3.5 text-slate-400" />
                      <SelectValue placeholder="Öncelik Filtresi" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tüm Öncelikler</SelectItem>
                    <SelectItem value="LOW">Düşük</SelectItem>
                    <SelectItem value="MEDIUM">Normal</SelectItem>
                    <SelectItem value="HIGH">Yüksek</SelectItem>
                    <SelectItem value="CRITICAL">Kritik</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(status !== 'ALL' || priority !== 'ALL' || search) && (
                <Button variant="ghost" size="sm" onClick={handleReset} className="h-9 text-xs gap-1 text-slate-600">
                  <RotateCcw className="h-3.5 w-3.5" /> Sıfırla
                </Button>
              )}
            </div>

            <div className="text-xs text-slate-500 font-medium whitespace-nowrap">
              Toplam <strong className="text-slate-900">{data?.totalElements || 0}</strong> Talep
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Data Table */}
      <Card className="border border-slate-200/80 shadow-xs bg-white">
        <CardContent className="p-0">
          {filteredTickets.length === 0 ? (
            <EmptyState
              title="Destek talebi bulunamadı"
              description="Arama kriterlerinizi değiştirebilir veya tüm filtreleri sıfırlayabilirsiniz."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="crm-table-header">
                    <TableHead className="w-40">Talep NO</TableHead>
                    <TableHead>Konu</TableHead>
                    <TableHead className="w-56">Müşteri</TableHead>
                    <TableHead className="w-32">Durum</TableHead>
                    <TableHead className="w-32">Öncelik</TableHead>
                    <TableHead className="w-36">Oluşturulma</TableHead>
                    <TableHead className="w-24 text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id} className="hover:bg-slate-50/80 crm-transition">
                      <TableCell className="font-mono font-semibold text-xs text-slate-900">
                        {ticket.ticketNumber}
                      </TableCell>
                      <TableCell className="text-xs text-slate-800 font-medium max-w-xs truncate" title={ticket.subject}>
                        {ticket.subject}
                      </TableCell>
                      <TableCell className="text-xs text-slate-900 font-semibold">
                        <span className="hover:text-indigo-600 cursor-pointer" onClick={() => navigate(`/customers/${ticket.customer.id}`)}>
                          {ticket.customer.firstName} {ticket.customer.lastName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={ticket.status} />
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={ticket.priority} />
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                        {ticket.createdAt ? format(new Date(ticket.createdAt), 'dd MMM yyyy', { locale: tr }) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => navigate(`/tickets/${ticket.id}`)}
                          title="Talep Detayı"
                          className="h-8 w-8 text-slate-600 hover:text-indigo-600"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/30">
              <span className="text-xs text-slate-500 font-medium">
                Sayfa <strong className="text-slate-900">{data.page + 1}</strong> / {data.totalPages} ({data.totalElements} Destek Kaydı)
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={data.first}
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Önceki
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={data.last}
                >
                  Sonraki <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
