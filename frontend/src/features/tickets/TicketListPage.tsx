import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { ticketApi } from '../../services/ticket';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { StatusBadge } from '../../components/ui/status-badge';
import { PriorityBadge } from '../../components/ui/priority-badge';
import { TableSkeleton } from '../../components/ui/skeletons';
import { EmptyState } from '../../components/ui/empty-state';

export default function TicketListPage() {
  const navigate = useNavigate();
  
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', page, statusFilter, priorityFilter],
    queryFn: () => ticketApi.getAll(page, 10, statusFilter, priorityFilter),
  });

  const handleClearFilters = () => {
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setPage(0);
  };

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="crm-page-title">Destek Talepleri</h1>
          <p className="crm-secondary-text mt-1">Müşteri destek bildirimleri, sorun takibi ve çözümleri</p>
        </div>
      </div>

      <Card className="border border-slate-200/80 shadow-xs bg-white">
        <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/40">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Select value={statusFilter} onValueChange={(val: string | null) => { setStatusFilter(val || 'ALL'); setPage(0); }}>
                <SelectTrigger className="w-[160px] h-9 text-xs bg-white">
                  <SelectValue placeholder="Durum Seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tüm Durumlar</SelectItem>
                  <SelectItem value="OPEN">Açık</SelectItem>
                  <SelectItem value="IN_PROGRESS">İşlemde</SelectItem>
                  <SelectItem value="RESOLVED">Çözüldü</SelectItem>
                  <SelectItem value="CLOSED">Kapalı</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={priorityFilter} onValueChange={(val: string | null) => { setPriorityFilter(val || 'ALL'); setPage(0); }}>
                <SelectTrigger className="w-[160px] h-9 text-xs bg-white">
                  <SelectValue placeholder="Öncelik Seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tüm Öncelikler</SelectItem>
                  <SelectItem value="LOW">Düşük</SelectItem>
                  <SelectItem value="MEDIUM">Normal</SelectItem>
                  <SelectItem value="HIGH">Yüksek</SelectItem>
                  <SelectItem value="CRITICAL">Kritik</SelectItem>
                </SelectContent>
              </Select>

              {(statusFilter !== 'ALL' || priorityFilter !== 'ALL') && (
                <Button type="button" variant="ghost" size="sm" onClick={handleClearFilters} className="h-9 text-xs text-slate-500">
                  <X className="h-3.5 w-3.5 mr-1" /> Temizle
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {data?.content.length === 0 ? (
            statusFilter !== 'ALL' || priorityFilter !== 'ALL' ? (
              <EmptyState
                title="Filtreleme kriterlerine uyan talep bulunamadı"
                description="Seçili durum veya öncelik filtrenize eşleşen bir kayıt bulunmuyor."
                actionLabel="Filtreleri Temizle"
                onAction={handleClearFilters}
              />
            ) : (
              <EmptyState
                title="Henüz destek talebi bulunmuyor"
                description="Müşteri sayfalarından yeni destek talepleri oluşturabilirsiniz."
              />
            )
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="crm-table-header">
                    <TableHead className="w-36">Talep No</TableHead>
                    <TableHead>Konu</TableHead>
                    <TableHead>Müşteri</TableHead>
                    <TableHead className="w-32">Öncelik</TableHead>
                    <TableHead className="w-28">Durum</TableHead>
                    <TableHead className="w-44 text-right">Oluşturulma</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.content.map((ticket) => (
                    <TableRow 
                      key={ticket.id} 
                      className="cursor-pointer hover:bg-slate-50/80 crm-transition"
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                    >
                      <TableCell className="font-semibold text-xs text-slate-900">
                        {ticket.ticketNumber}
                      </TableCell>
                      <TableCell className="font-medium text-xs text-slate-800 max-w-[220px] truncate">
                        {ticket.subject}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {ticket.customer ? `${ticket.customer.firstName} ${ticket.customer.lastName}` : '#'}
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={ticket.priority} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={ticket.status} />
                      </TableCell>
                      <TableCell className="text-right text-xs text-slate-500">
                        {format(new Date(ticket.createdAt), 'dd MMM yyyy, HH:mm', { locale: tr })}
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
                Sayfa <strong className="text-slate-900">{data.page + 1}</strong> / {data.totalPages} ({data.totalElements} Kayıt)
              </span>
              <div className="flex items-center gap-1.5">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs gap-1"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={data.first}
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Önceki
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs gap-1"
                  onClick={() => setPage(p => p + 1)}
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
