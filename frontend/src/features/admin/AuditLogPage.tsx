import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../../services/audit';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Activity as ActivityIcon, ChevronLeft, ChevronRight, Search, Filter, RotateCcw } from 'lucide-react';
import { useAuthStore } from '../../app/store';
import { Navigate } from 'react-router';
import { UserAvatar } from '../../components/ui/user-avatar';
import { TableSkeleton } from '../../components/ui/skeletons';
import { EmptyState } from '../../components/ui/empty-state';

export default function AuditLogPage() {
  const { user } = useAuthStore();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['auditLogs', page, search, actionFilter],
    queryFn: () => auditApi.getAll(page, 20, search, actionFilter),
    enabled: user?.role === 'ADMIN',
  });

  const handleResetFilters = () => {
    setSearch('');
    setActionFilter('ALL');
    setPage(0);
  };

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  const getActionBadgeTr = (action: string) => {
    switch(action) {
      case 'LOGIN': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold">GİRİŞ</Badge>;
      case 'CUSTOMER_CREATE': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold">MÜŞTERİ EKLENDİ</Badge>;
      case 'CUSTOMER_UPDATE': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-semibold">MÜŞTERİ GÜNCELLEDİ</Badge>;
      case 'CUSTOMER_DELETE': return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-xs font-semibold">MÜŞTERİ SİLİNDİ</Badge>;
      case 'TICKET_CREATE': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold">TALEP OLUŞTURULDU</Badge>;
      case 'TICKET_ASSIGN': return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs font-semibold">TALEP ATANDI</Badge>;
      case 'TICKET_STATUS_CHANGE': return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-semibold">TALEP DURUM DEĞİŞTİ</Badge>;
      case 'TICKET_PRIORITY_CHANGE': return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-semibold">TALEP ÖNCELİK DEĞİŞTİ</Badge>;
      case 'USER_CREATE': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold">KULLANICI OLUŞTURULDU</Badge>;
      case 'USER_UPDATE': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-semibold">KULLANICI GÜNCELLEDİ</Badge>;
      case 'USER_ROLE_CHANGE': return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs font-semibold">KULLANICI ROL DEĞİŞTİ</Badge>;
      case 'USER_ENABLE': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold">KULLANICI AKTİF EDİLDİ</Badge>;
      case 'USER_DISABLE': return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-xs font-semibold">KULLANICI PASİF EDİLDİ</Badge>;
      default: return <Badge variant="outline" className="text-xs">{action}</Badge>;
    }
  };

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="crm-page-title">Denetim Kayıtları</h1>
          <p className="crm-secondary-text mt-1">Sistem güvenliği, kullanıcı eylemleri ve yapısal değişikliklerin iz kaydı</p>
        </div>
      </div>

      {/* Filter & Toolbar Bar */}
      <Card className="border border-slate-200/80 shadow-xs bg-white">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-1 flex-col sm:flex-row items-center gap-3 w-full">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Detay, varlık ID veya IP adresi ara..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                  className="pl-9 h-9 text-xs"
                />
              </div>

              {/* Action Filter */}
              <div className="w-full sm:w-52">
                <Select value={actionFilter} onValueChange={(val) => { setActionFilter(val || 'ALL'); setPage(0); }}>
                  <SelectTrigger className="h-9 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Filter className="h-3.5 w-3.5 text-slate-400" />
                      <SelectValue placeholder="İşlem Filtresi" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tüm İşlemler</SelectItem>
                    <SelectItem value="LOGIN">GİRİŞ</SelectItem>
                    <SelectItem value="CUSTOMER_CREATE">MÜŞTERİ EKLENDİ</SelectItem>
                    <SelectItem value="CUSTOMER_UPDATE">MÜŞTERİ GÜNCELLEDİ</SelectItem>
                    <SelectItem value="CUSTOMER_DELETE">MÜŞTERİ SİLİNDİ</SelectItem>
                    <SelectItem value="TICKET_CREATE">TALEP OLUŞTURULDU</SelectItem>
                    <SelectItem value="TICKET_ASSIGN">TALEP ATANDI</SelectItem>
                    <SelectItem value="TICKET_STATUS_CHANGE">TALEP DURUM DEĞİŞTİ</SelectItem>
                    <SelectItem value="USER_ROLE_CHANGE">KULLANICI ROL DEĞİŞTİ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(search || actionFilter !== 'ALL') && (
                <Button variant="ghost" size="sm" onClick={handleResetFilters} className="h-9 text-xs gap-1 text-slate-600">
                  <RotateCcw className="h-3.5 w-3.5" /> Sıfırla
                </Button>
              )}
            </div>

            <div className="text-xs text-slate-500 font-medium whitespace-nowrap">
              Toplam <strong className="text-slate-900">{data?.totalElements || 0}</strong> Log Kaydı
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200/80 shadow-xs bg-white">
        <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/40">
          <CardTitle className="text-sm font-semibold text-slate-900">Sistem Denetim Logları</CardTitle>
          <CardDescription className="text-xs text-slate-500">Güvenlik izleme ve denetim log akışı</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {data?.content.length === 0 ? (
            <EmptyState
              icon={ActivityIcon}
              title="Denetim kaydı bulunmuyor"
              description="Sistemde henüz kaydedilmiş bir denetim logu mevcut değil."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="crm-table-header">
                    <TableHead className="w-44">Tarih</TableHead>
                    <TableHead className="w-56">Kullanıcı</TableHead>
                    <TableHead className="w-48">İşlem</TableHead>
                    <TableHead className="w-32">Varlık (ID)</TableHead>
                    <TableHead className="w-32">IP Adresi</TableHead>
                    <TableHead>Detay</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.content.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50/80 crm-transition text-xs">
                      <TableCell className="text-slate-500 whitespace-nowrap">
                        {format(new Date(log.createdAt), 'dd MMM yyyy, HH:mm:ss', { locale: tr })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <UserAvatar name={log.user?.name || 'Sistem'} size="sm" />
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900">{log.user?.name || 'Sistem'}</span>
                            <span className="text-[10px] text-slate-400">{log.user?.email || 'System'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getActionBadgeTr(log.action)}
                      </TableCell>
                      <TableCell className="font-mono text-slate-700">
                        {log.entityType} #{log.entityId}
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-slate-500">
                        {log.ipAddress}
                      </TableCell>
                      <TableCell className="text-slate-600 max-w-xs truncate" title={log.details}>
                        {log.details}
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
                Sayfa <strong className="text-slate-900">{data.page + 1}</strong> / {data.totalPages} ({data.totalElements} Log Kaydı)
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
