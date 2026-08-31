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
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Search, Plus, Eye, Edit, Trash2, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { Skeleton } from '../../components/ui/skeleton';
import { toast } from 'sonner';

export default function CustomerListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
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
      toast.error('Bu müşteri ilişkili kayıtları bulunduğu için silinemez.');
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <Badge className="bg-emerald-500 hover:bg-emerald-600">Aktif</Badge>;
      case 'INACTIVE': return <Badge variant="secondary">Pasif</Badge>;
      case 'BLOCKED': return <Badge variant="destructive">Engelli</Badge>;
      default: return <Badge>{status}</Badge>;
    }
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Müşteriler</h2>
        
        {canManage && (
          <Button onClick={() => navigate('/customers/new')} className="shrink-0">
            <Plus className="mr-2 h-4 w-4" /> Yeni Müşteri
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-4">
          <form onSubmit={handleSearch} className="flex gap-2 max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Müşteri ara..."
                className="pl-9"
                value={searchInput}
                onChange={(e: React.FormEvent) => setSearchInput((e.target as HTMLInputElement).value)}
              />
            </div>
            <Button type="submit" variant="secondary">Ara</Button>
          </form>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Şirket</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-[60px]" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Users className="h-12 w-12 text-red-300" />
                        <div className="text-lg font-medium text-red-900">Müşteriler yüklenemedi.</div>
                        <p className="text-sm text-red-500 max-w-sm mx-auto">
                          Bir hata oluştu. Lütfen sayfayı yenileyin veya tekrar deneyin.
                        </p>
                        <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['customers'] })} className="mt-4">
                          Tekrar Dene
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : data?.content.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Users className="h-12 w-12 text-slate-300" />
                        <div className="text-lg font-medium text-slate-900">Müşteri bulunamadı.</div>
                        <p className="text-sm text-slate-500 max-w-sm mx-auto">
                          Yeni müşteri ekleyerek CRM'i kullanmaya başlayabilirsiniz.
                        </p>
                        {canManage && (
                           <Button onClick={() => navigate('/customers/new')} className="mt-4">
                             <Plus className="mr-2 h-4 w-4" /> Yeni Müşteri
                           </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.content.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">
                        {customer.firstName} {customer.lastName}
                      </TableCell>
                      <TableCell>{customer.company}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{getCustomerTypeTr(customer.customerType)}</TableCell>
                      <TableCell>{getStatusBadge(customer.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => navigate(`/customers/${customer.id}`)}
                            title="Görüntüle"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {canManage && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => navigate(`/customers/${customer.id}/edit`)}
                              title="Düzenle"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}

                          {canDelete && (
                            <Dialog open={deleteId === customer.id} onOpenChange={(open: boolean) => !open && setDeleteId(null)}>
                              <DialogTrigger>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => setDeleteId(customer.id)}
                                  title="Sil"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Müşteriyi silmek istediğinize emin misiniz?</DialogTitle>
                                  <DialogDescription>
                                    Bu işlem geri alınamaz. Müşteri ve ilişkili verileri kalıcı olarak silinecektir.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setDeleteId(null)}>İptal</Button>
                                  <Button 
                                    variant="destructive" 
                                    onClick={() => deleteMutation.mutate(customer.id)}
                                    disabled={deleteMutation.isPending}
                                  >
                                    {deleteMutation.isPending ? 'Siliniyor...' : 'Sil'}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
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
