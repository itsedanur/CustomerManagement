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
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import { Ticket as TicketIcon } from 'lucide-react';

export default function TicketListPage() {
  const navigate = useNavigate();
  
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', page, statusFilter, priorityFilter],
    queryFn: () => ticketApi.getAll(page, 10, statusFilter, priorityFilter),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN': return <Badge className="bg-amber-500 hover:bg-amber-600">Açık</Badge>;
      case 'IN_PROGRESS': return <Badge className="bg-blue-500 hover:bg-blue-600">İşlemde</Badge>;
      case 'RESOLVED': return <Badge className="bg-emerald-500 hover:bg-emerald-600">Çözüldü</Badge>;
      case 'CLOSED': return <Badge variant="secondary">Kapalı</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'LOW': return <Badge variant="outline" className="text-slate-500 border-slate-200 bg-slate-50">Düşük</Badge>;
      case 'MEDIUM': return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Orta</Badge>;
      case 'HIGH': return <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Yüksek</Badge>;
      case 'CRITICAL': return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Kritik</Badge>;
      default: return <Badge>{priority}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Destek Talepleri</h2>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <CardTitle>Tüm Destek Talepleri</CardTitle>
            
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={(val: string | null) => { setStatusFilter(val || 'ALL'); setPage(0); }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Duruma göre filtrele" />
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
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Önceliğe göre filtrele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tüm Öncelikler</SelectItem>
                  <SelectItem value="LOW">Düşük</SelectItem>
                  <SelectItem value="MEDIUM">Orta</SelectItem>
                  <SelectItem value="HIGH">Yüksek</SelectItem>
                  <SelectItem value="CRITICAL">Kritik</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Talep No</TableHead>
                  <TableHead>Konu</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Öncelik</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Oluşturulma</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    </TableRow>
                  ))
                ) : data?.content.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <TicketIcon className="h-12 w-12 text-slate-300" />
                        <div className="text-lg font-medium text-slate-900">Destek talebi bulunamadı.</div>
                        <p className="text-sm text-slate-500">
                          Yeni bir destek talebi oluşturarak süreci başlatabilirsiniz.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.content.map((ticket) => (
                    <TableRow 
                      key={ticket.id} 
                      className="cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                    >
                      <TableCell className="font-medium font-mono text-slate-600">{ticket.ticketNumber}</TableCell>
                      <TableCell className="font-medium text-slate-900">{ticket.subject}</TableCell>
                      <TableCell className="text-slate-500">
                        {ticket.customer.firstName} {ticket.customer.lastName}
                      </TableCell>
                      <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell className="text-slate-500">
                        {format(new Date(ticket.createdAt), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-slate-500">
                Sayfa {data.page + 1} / {data.totalPages}
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={data.first}
                >
                  Önceki
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => p + 1)}
                  disabled={data.last}
                >
                  Sonraki
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
