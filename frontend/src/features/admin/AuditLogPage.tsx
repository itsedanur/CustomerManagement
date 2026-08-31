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
import { Skeleton } from '../../components/ui/skeleton';
import { Activity as ActivityIcon } from 'lucide-react';
import { useAuthStore } from '../../app/store';
import { Navigate } from 'react-router';
import { PageHeader } from '../../components/ui/page-header';

export default function AuditLogPage() {
  const { user } = useAuthStore();
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['auditLogs', page],
    queryFn: () => auditApi.getAll(page, 20),
    enabled: user?.role === 'ADMIN',
  });

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  const getActionBadgeTr = (action: string) => {
    switch(action) {
      case 'LOGIN': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">GİRİŞ</Badge>;
      case 'CUSTOMER_CREATE': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">MÜŞTERİ EKLENDİ</Badge>;
      case 'CUSTOMER_UPDATE': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">MÜŞTERİ GÜNCELLEDİ</Badge>;
      case 'CUSTOMER_DELETE': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">MÜŞTERİ SİLİNDİ</Badge>;
      case 'TICKET_CREATE': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">TALEP OLUŞTURULDU</Badge>;
      case 'TICKET_ASSIGN': return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">TALEP ATANDI</Badge>;
      case 'TICKET_STATUS_CHANGE': return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">TALEP DURUM DEĞİŞTİ</Badge>;
      case 'TICKET_PRIORITY_CHANGE': return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">TALEP ÖNCELİK DEĞİŞTİ</Badge>;
      case 'USER_CREATE': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">KULLANICI OLUŞTURULDU</Badge>;
      case 'USER_UPDATE': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">KULLANICI GÜNCELLEDİ</Badge>;
      case 'USER_ROLE_CHANGE': return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">KULLANICI ROL DEĞİŞTİ</Badge>;
      case 'USER_ENABLE': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">KULLANICI AKTİF EDİLDİ</Badge>;
      case 'USER_DISABLE': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">KULLANICI PASİF EDİLDİ</Badge>;
      default: return <Badge variant="outline">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Denetim Kayıtları"
        breadcrumbs={[
          { label: 'Yönetim' },
          { label: 'Denetim Kayıtları', href: '/admin/audit-logs' }
        ]}
      />

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Sistem Denetim Kayıtları</CardTitle>
          <CardDescription>Güvenlik ve işlem takibi için sistemdeki tüm yapısal değişikliklerin kaydı.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>İşlem</TableHead>
                  <TableHead>Varlık (ID)</TableHead>
                  <TableHead>IP Adresi</TableHead>
                  <TableHead>Detay</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                    </TableRow>
                  ))
                ) : data?.content.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <ActivityIcon className="h-12 w-12 text-slate-300" />
                        <div className="text-lg font-medium text-slate-900">Henüz denetim kaydı bulunmuyor.</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.content.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50">
                      <TableCell className="text-slate-500 whitespace-nowrap">
                        {format(new Date(log.createdAt), 'dd MMM yyyy HH:mm:ss', { locale: tr })}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{log.user?.name || 'Sistem'}</span>
                          <span className="text-xs text-slate-500">{log.user?.email || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getActionBadgeTr(log.action)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-slate-700">{log.entityType}</span>
                          <span className="text-slate-400">#</span>
                          <span className="font-mono text-sm text-slate-600">{log.entityId}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">
                        {log.ipAddress}
                      </TableCell>
                      <TableCell className="text-slate-600 max-w-xs truncate" title={log.details}>
                        {log.details}
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
