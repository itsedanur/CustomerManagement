import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi, type Customer } from '../../services/customer';
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
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Plus, Search, Edit2, Trash2, Eye, Filter, RotateCcw, ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../../app/store';
import { toast } from 'sonner';
import { UserAvatar } from '../../components/ui/user-avatar';
import { StatusBadge } from '../../components/ui/status-badge';
import { TableSkeleton } from '../../components/ui/skeletons';
import { EmptyState } from '../../components/ui/empty-state';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { mapCustomerType } from '../../utils/enum-mapper';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function CustomerListPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search, statusFilter, typeFilter],
    queryFn: () => customerApi.getAll(page, 10, search, statusFilter, typeFilter),
  });

  const deleteMutation = useMutation({
    mutationFn: customerApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setDeleteCustomer(null);
      toast.success('Müşteri başarıyla silindi');
    },
    onError: () => {
      setDeleteCustomer(null);
      toast.error('Müşteri silinirken bir hata oluştu');
    }
  });

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setTypeFilter('ALL');
    setPage(0);
  };

  const filteredContent = data?.content || [];

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="crm-page-title">Müşteriler</h1>
          <p className="crm-secondary-text mt-1">Sistemdeki tüm bireysel ve kurumsal müşteri hesapları</p>
        </div>
        {user?.role !== 'AGENT' && (
          <Button onClick={() => navigate('/customers/new')} className="bg-slate-900 hover:bg-slate-800 text-white gap-2 shadow-xs">
            <Plus className="h-4 w-4" /> Yeni Müşteri Ekle
          </Button>
        )}
      </div>

      {/* Filter & Toolbar Bar */}
      <Card className="border border-slate-200/80 shadow-xs bg-white">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-1 flex-col sm:flex-row items-center gap-3 w-full">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="İsim, şirket veya e-posta ara..."
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
                <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || 'ALL')}>
                  <SelectTrigger className="h-9 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Filter className="h-3.5 w-3.5 text-slate-400" />
                      <SelectValue placeholder="Durum Filtresi" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tüm Durumlar</SelectItem>
                    <SelectItem value="ACTIVE">Aktif</SelectItem>
                    <SelectItem value="INACTIVE">Pasif</SelectItem>
                    <SelectItem value="BLOCKED">Engelli</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div className="w-full sm:w-44">
                <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val || 'ALL')}>
                  <SelectTrigger className="h-9 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      <SelectValue placeholder="Müşteri Tipi" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tüm Tipler</SelectItem>
                    <SelectItem value="INDIVIDUAL">Bireysel</SelectItem>
                    <SelectItem value="CORPORATE">Kurumsal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(search || statusFilter !== 'ALL' || typeFilter !== 'ALL') && (
                <Button variant="ghost" size="sm" onClick={handleResetFilters} className="h-9 text-xs gap-1 text-slate-600">
                  <RotateCcw className="h-3.5 w-3.5" /> Sıfırla
                </Button>
              )}
            </div>

            <div className="text-xs text-slate-500 font-medium whitespace-nowrap">
              Toplam <strong className="text-slate-900">{data?.totalElements || 0}</strong> Müşteri
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Data Table */}
      <Card className="border border-slate-200/80 shadow-xs bg-white">
        <CardContent className="p-0">
          {filteredContent.length === 0 ? (
            <EmptyState
              title={search || statusFilter !== 'ALL' || typeFilter !== 'ALL' ? "Filtrelere uygun müşteri bulunamadı" : "Henüz müşteri bulunmuyor"}
              description="Arama kriterlerinizi değiştirebilir veya yeni bir müşteri ekleyebilirsiniz."
              actionLabel={user?.role !== 'AGENT' ? "Yeni Müşteri Ekle" : undefined}
              onAction={() => navigate('/customers/new')}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="crm-table-header">
                    <TableHead className="w-64">Müşteri</TableHead>
                    <TableHead className="w-56">Şirket</TableHead>
                    <TableHead className="w-48">E-posta & Telefon</TableHead>
                    <TableHead className="w-32">Tip</TableHead>
                    <TableHead className="w-32">Durum</TableHead>
                    <TableHead className="w-36">Kayıt Tarihi</TableHead>
                    <TableHead className="w-36 text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContent.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-slate-50/80 crm-transition">
                      <TableCell className="font-semibold text-xs text-slate-900">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={`${customer.firstName} ${customer.lastName}`} size="md" />
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 hover:text-indigo-600 cursor-pointer" onClick={() => navigate(`/customers/${customer.id}`)}>
                              {customer.firstName} {customer.lastName}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">#{customer.id}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 font-medium">
                        {customer.company || '-'}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        <div className="flex flex-col">
                          <span>{customer.email}</span>
                          <span className="text-[11px] text-slate-400">{customer.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${customer.customerType === 'CORPORATE' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60' : 'bg-slate-100 text-slate-700'}`}>
                          {mapCustomerType(customer.customerType)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={customer.status} />
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                        {customer.createdAt ? format(new Date(customer.createdAt), 'dd MMM yyyy', { locale: tr }) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => navigate(`/customers/${customer.id}`)}
                            title="Müşteri Detayı"
                            className="h-8 w-8 text-slate-600 hover:text-indigo-600"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {user?.role !== 'AGENT' && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => navigate(`/customers/${customer.id}/edit`)}
                                title="Düzenle"
                                className="h-8 w-8 text-slate-600 hover:text-indigo-600"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              {user?.role === 'ADMIN' && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setDeleteCustomer(customer)}
                                  title="Sil"
                                  className="h-8 w-8 text-slate-600 hover:text-rose-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Controls */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/30">
              <span className="text-xs text-slate-500 font-medium">
                Sayfa <strong className="text-slate-900">{data.page + 1}</strong> / {data.totalPages} ({data.totalElements} Müşteri Kaydı)
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

      {/* Confirmation Dialog for Customer Deletion */}
      <ConfirmDialog
        open={deleteCustomer !== null}
        onOpenChange={(open) => !open && setDeleteCustomer(null)}
        title="Müşteriyi Sil"
        description={`${deleteCustomer?.firstName} ${deleteCustomer?.lastName} isimli müşteriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Müşteriyi Sil"
        variant="destructive"
        onConfirm={() => deleteCustomer && deleteMutation.mutate(deleteCustomer.id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
