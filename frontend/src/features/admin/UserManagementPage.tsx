import { useState } from 'react';
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
import { Shield, ShieldAlert, ShieldCheck, UserCog, Check, X } from 'lucide-react';
import { useAuthStore } from '../../app/store';
import { Navigate } from 'react-router';
import { toast } from 'sonner';
import { UserAvatar } from '../../components/ui/user-avatar';
import { TableSkeleton } from '../../components/ui/skeletons';
import { EmptyState } from '../../components/ui/empty-state';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { formatUserName } from '../../utils/enum-mapper';

export default function UserManagementPage() {
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [toggleUser, setToggleUser] = useState<User | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: userApi.getAll,
    enabled: currentUser?.role === 'ADMIN',
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) => userApi.changeStatus(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setToggleUser(null);
      toast.success('Kullanıcı durumu güncellendi');
    },
    onError: () => {
      setToggleUser(null);
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
      case 'ADMIN': return <Badge className="bg-rose-50 text-rose-700 border-rose-200 border text-xs gap-1 font-semibold"><ShieldAlert className="h-3 w-3" /> Yönetici</Badge>;
      case 'MANAGER': return <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 border text-xs gap-1 font-semibold"><ShieldCheck className="h-3 w-3" /> Yönetici Yrd.</Badge>;
      case 'USER':
      case 'AGENT': return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border text-xs gap-1 font-semibold"><Shield className="h-3 w-3" /> Temsilci</Badge>;
      default: return <Badge variant="outline">{role}</Badge>;
    }
  };

  const cycleRole = (u: User) => {
    if (u.id === currentUser.id) {
      toast.error('Kendi rolünüzü değiştiremezsiniz');
      return;
    }
    const roles = ['USER', 'MANAGER', 'ADMIN'];
    const currentIndex = roles.indexOf(u.role);
    const nextRole = roles[(currentIndex + 1) % roles.length];
    changeRoleMutation.mutate({ id: u.id, role: nextRole });
  };

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="crm-page-title">Kullanıcı Yönetimi</h1>
          <p className="crm-secondary-text mt-1">Sisteme erişimi olan kullanıcı hesapları, yetkiler ve güvenlik denetimi</p>
        </div>
      </div>

      <Card className="border border-slate-200/80 shadow-xs bg-white">
        <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/40">
          <CardTitle className="text-sm font-semibold text-slate-900">Sistem Kullanıcıları</CardTitle>
          <CardDescription className="text-xs text-slate-500">Temsilci yetkileri ve aktiflik durumları</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {users?.length === 0 ? (
            <EmptyState
              icon={UserCog}
              title="Kullanıcı kaydı bulunamadı"
              description="Sistemde henüz aktif kullanıcı kaydı bulunmuyor."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="crm-table-header">
                    <TableHead className="w-56">Kullanıcı</TableHead>
                    <TableHead>E-posta</TableHead>
                    <TableHead className="w-32">Rol</TableHead>
                    <TableHead className="w-28 text-center">Açık Talep</TableHead>
                    <TableHead className="w-28 text-center">Aktif Görev</TableHead>
                    <TableHead className="w-24">Durum</TableHead>
                    <TableHead className="w-44 text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((u) => (
                    <TableRow key={u.id} className="hover:bg-slate-50/80 crm-transition">
                      <TableCell className="font-semibold text-xs text-slate-900">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={formatUserName(u.firstName, u.lastName)} size="sm" />
                          <div className="flex items-center gap-1.5">
                            <span>{formatUserName(u.firstName, u.lastName)}</span>
                            {u.id === currentUser.id && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md border font-normal">(Siz)</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{u.email}</TableCell>
                      <TableCell>{getRoleBadge(u.role)}</TableCell>
                      <TableCell className="text-center font-semibold text-xs text-slate-900">{u.openTicketsCount ?? 0}</TableCell>
                      <TableCell className="text-center font-semibold text-xs text-slate-900">{u.activeTasksCount ?? 0}</TableCell>
                      <TableCell>
                        {u.enabled ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs gap-1 font-medium">
                            <Check className="h-3 w-3" /> Aktif
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-xs gap-1 font-medium">
                            <X className="h-3 w-3" /> Pasif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => cycleRole(u)}
                            disabled={u.id === currentUser.id || changeRoleMutation.isPending}
                            className="h-8 text-xs"
                          >
                            Rol Değiştir
                          </Button>
                          <Button 
                            variant={u.enabled ? "outline" : "default"}
                            size="sm"
                            onClick={() => setToggleUser(u)}
                            disabled={u.id === currentUser.id || toggleStatusMutation.isPending}
                            className={`h-8 text-xs ${!u.enabled ? "bg-slate-900 text-white" : "text-rose-600 hover:bg-rose-50 border-rose-200"}`}
                          >
                            {u.enabled ? 'Devre Dışı Bırak' : 'Aktifleştir'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Dialog for Status Toggle */}
      <ConfirmDialog
        open={toggleUser !== null}
        onOpenChange={(open) => !open && setToggleUser(null)}
        title={toggleUser?.enabled ? "Kullanıcıyı Devre Dışı Bırak" : "Kullanıcıyı Aktifleştir"}
        description={
          toggleUser?.enabled 
            ? `${toggleUser.firstName} ${toggleUser.lastName} kullanıcısının sisteme giriş izni kaldırılacaktır.`
            : `${toggleUser?.firstName} ${toggleUser?.lastName} kullanıcısının sisteme giriş erişimi tekrar açılacaktır.`
        }
        confirmText={toggleUser?.enabled ? "Devre Dışı Bırak" : "Aktifleştir"}
        variant={toggleUser?.enabled ? "destructive" : "default"}
        onConfirm={() => toggleUser && toggleStatusMutation.mutate({ id: toggleUser.id, enabled: !toggleUser.enabled })}
        isLoading={toggleStatusMutation.isPending}
      />
    </div>
  );
}
