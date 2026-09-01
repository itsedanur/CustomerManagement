import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { customerApi } from '../../services/customer';
import { useAuthStore } from '../../app/store';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Search, Plus, Eye, Edit, Trash2, X, ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from '../../components/ui/status-badge';
import { UserAvatar } from '../../components/ui/user-avatar';
import { EmptyState } from '../../components/ui/empty-state';
import { TableSkeleton } from '../../components/ui/skeletons';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';

export default function CustomerListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['customers', page, search],
    queryFn: () => customerApi.getAll(page, 10, search),
  });

  const deleteMutation = useMutation({
    mutationFn: customerApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setDeleteId(null);
      toast.success('Müşteri başarıyla silindi.');
    },
    onError: () => {
      setDeleteId(null);
      toast.error('Bu müşteri ilişkili kayıtları (destek talebi/adres) bulunduğu için silinemez.');
    },
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(0);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearch('');
    setStatusFilter('ALL');
    setTypeFilter('ALL');
    setPage(0);
  };

  const getCustomerTypeTr = (type: string) => {
    switch (type) {
      case 'INDIVIDUAL': return 'Bireysel';
      case 'CORPORATE': return 'Kurumsal';
      default: return type;
    }
  };

  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const canDelete = user?.role === 'ADMIN';

  // Filter client side if status/type filters applied (backend search supports text query)
  const filteredContent = data?.content.filter(customer => {
    if (statusFilter !== 'ALL' && customer.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && customer.customerType !== typeFilter) return false;
    return true;
  }) || [];

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="crm-page-title">Müşteriler</h1>
          <p className="crm-secondary-text mt-1">Müşteri hesapları, şirket bilgileri ve iletişim yönetimi</p>
        </div>
        
        {canManage && (
          <Button onClick={() => navigate('/customers/new')} className="bg-slate-900 text-white hover:bg-slate-800 text-xs h-9 shadow-xs">
            <Plus className="mr-1.5 h-4 w-4" /> Yeni Müşteri Ekle
          </Button>
        )}
      </div>

      {/* Main Container */}
      <Card className="border border-slate-200/80 shadow-xs bg-white">
        <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/40">
          <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="İsim, e-posta veya şirket ara..."
                className="pl-9 h-9 text-xs bg-white"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-md border border-slate-200 text-xs bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
            >
              <option value="ALL">Tüm Durumlar</option>
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Pasif</option>
              <option value="SUSPENDED">Engelli</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 px-3 rounded-md border border-slate-200 text-xs bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
            >
              <option value="ALL">Tüm Tipler</option>
              <option value="INDIVIDUAL">Bireysel</option>
              <option value="CORPORATE">Kurumsal</option>
            </select>

            <Button type="submit" variant="secondary" size="sm" className="h-9 text-xs">
              Filtrele
            </Button>

            {(search || statusFilter !== 'ALL' || typeFilter !== 'ALL') && (
              <Button type="button" variant="ghost" size="sm" onClick={handleClearFilters} className="h-9 text-xs text-slate-500">
                <X className="h-3.5 w-3.5 mr-1" /> Temizle
              </Button>
            )}
          </form>
        </CardHeader>
        <CardContent className="p-0">
          {isError ? (
            <div className="p-8 text-center text-rose-600">
              <ShieldAlert className="h-8 w-8 mx-auto mb-2 text-rose-500" />
              <h3 className="font-semibold text-sm">Müşteriler yüklenemedi.</h3>
              <p className="text-xs text-rose-500 mt-1 mb-4">Bir sunucu hatası oluştu.</p>
              <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['customers'] })}>
                Tekrar Dene
              </Button>
            </div>
          ) : filteredContent.length === 0 ? (
            search || statusFilter !== 'ALL' || typeFilter !== 'ALL' ? (
              <EmptyState
                title="Aramanızla eşleşen müşteri bulunamadı"
                description="Filtreleme kriterlerinizi değiştirerek veya aramayı temizleyerek tekrar deneyebilirsiniz."
                actionLabel="Filtreleri Temizle"
                onAction={handleClearFilters}
              />
            ) : (
              <EmptyState
                title="Henüz müşteri eklenmemiş"
                description="CRM sisteminizde kayıtlı müşteri bulunmuyor. İlk müşterinizi oluşturarak başlayın."
                actionLabel={canManage ? "Yeni Müşteri Ekle" : undefined}
                onAction={canManage ? () => navigate('/customers/new') : undefined}
              />
            )
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="crm-table-header">
                    <TableHead className="w-64">Müşteri</TableHead>
                    <TableHead>Şirket</TableHead>
                    <TableHead>E-posta</TableHead>
                    <TableHead className="w-24">Tip</TableHead>
                    <TableHead className="w-28">Durum</TableHead>
                    <TableHead className="w-32 text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContent.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-slate-50/80 crm-transition">
                      <TableCell className="font-medium text-xs text-slate-900">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={`${customer.firstName} ${customer.lastName}`} size="sm" />
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900">
                              {customer.firstName} {customer.lastName}
                            </span>
                            <span className="text-[11px] text-slate-400 sm:hidden">{customer.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{customer.company || '-'}</TableCell>
                      <TableCell className="text-xs text-slate-600">{customer.email}</TableCell>
                      <TableCell className="text-xs text-slate-600 font-medium">
                        {getCustomerTypeTr(customer.customerType)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={customer.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                            onClick={() => navigate(`/customers/${customer.id}`)}
                            title="Görüntüle"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {canManage && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                              onClick={() => navigate(`/customers/${customer.id}/edit`)}
                              title="Düzenle"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}

                          {canDelete && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                              onClick={() => setDeleteId(customer.id)}
                              title="Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Müşteriyi Sil"
        description="Müşteri kaydını silmek istediğinize emin misiniz? Müşteriye ait destek talepleri veya adresler varsa silme işlemi engellenecektir."
        confirmText="Müşteriyi Sil"
        cancelText="Vazgeç"
        variant="destructive"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
