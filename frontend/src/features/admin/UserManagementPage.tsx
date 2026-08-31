
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, type User } from '../../services/user';
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
import { Shield, ShieldAlert, ShieldCheck, UserCog, Check, X, Plus } from 'lucide-react';
import { useAuthStore } from '../../app/store';
import { Navigate } from 'react-router';
import { toast } from 'sonner';
import { PageHeader } from '../../components/ui/page-header';

export default function UserManagementPage() {
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: userApi.getAll,
    enabled: currentUser?.role === 'ADMIN',
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) => userApi.changeStatus(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Kullanıcı durumu güncellendi');
    },
    onError: () => {
      toast.error('Kullanıcı durumu güncellenirken hata oluştu');
    }
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => userApi.changeRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Kullanıcı rolü güncellendi');
    },
    onError: () => {
      toast.error('Kullanıcı rolü güncellenirken hata oluştu');
    }
  });

  if (currentUser?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'ADMIN': return <Badge className="bg-red-500 hover:bg-red-600"><ShieldAlert className="h-3 w-3 mr-1" /> Yönetici</Badge>;
      case 'MANAGER': return <Badge className="bg-blue-500 hover:bg-blue-600"><ShieldCheck className="h-3 w-3 mr-1" /> Müdür</Badge>;
      case 'AGENT': return <Badge className="bg-emerald-500 hover:bg-emerald-600"><Shield className="h-3 w-3 mr-1" /> Temsilci</Badge>;
      default: return <Badge>{role}</Badge>;
    }
  };

  const handleToggleStatus = (user: User) => {
    if (user.id === currentUser.id) {
      toast.error('Kendi durumunuzu değiştiremezsiniz');
      return;
    }
    toggleStatusMutation.mutate({ id: user.id, enabled: !user.enabled });
  };

  const cycleRole = (user: User) => {
    if (user.id === currentUser.id) {
      toast.error('Kendi rolünüzü değiştiremezsiniz');
      return;
    }
    const roles = ['AGENT', 'MANAGER', 'ADMIN'];
    const currentIndex = roles.indexOf(user.role);
    const nextRole = roles[(currentIndex + 1) % roles.length];
    changeRoleMutation.mutate({ id: user.id, role: nextRole });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Kullanıcı Yönetimi"
        breadcrumbs={[
          { label: 'Yönetim' },
          { label: 'Kullanıcılar', href: '/admin/users' }
        ]}
        actions={
          <Button onClick={() => toast.info('Yeni kullanıcı ekleme formu yakında eklenecek')}>
            <Plus className="h-4 w-4 mr-2" /> Yeni Kullanıcı
          </Button>
        }
      />

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Sistem Kullanıcıları</CardTitle>
          <CardDescription>Sisteme erişimi olan tüm kullanıcıları, rollerini ve durumlarını yönetin.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-[100px] ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : users?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <UserCog className="h-12 w-12 text-slate-300" />
                        <div className="text-lg font-medium text-slate-900">Kullanıcı bulunamadı.</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  users?.map((u) => (
                    <TableRow key={u.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium text-slate-900">
                        {u.firstName} {u.lastName}
                        {u.id === currentUser.id && (
                          <span className="ml-2 text-xs text-slate-500 font-normal">(Sen)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {u.email}
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(u.role)}
                      </TableCell>
                      <TableCell>
                        {u.enabled ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            <Check className="h-3 w-3 mr-1" /> Aktif
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <X className="h-3 w-3 mr-1" /> Pasif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => cycleRole(u)}
                            disabled={u.id === currentUser.id || changeRoleMutation.isPending}
                          >
                            Rol Değiştir
                          </Button>
                          <Button 
                            variant={u.enabled ? "destructive" : "default"}
                            size="sm"
                            onClick={() => handleToggleStatus(u)}
                            disabled={u.id === currentUser.id || toggleStatusMutation.isPending}
                            className={!u.enabled ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                          >
                            {u.enabled ? 'Devre Dışı Bırak' : 'Aktifleştir'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
