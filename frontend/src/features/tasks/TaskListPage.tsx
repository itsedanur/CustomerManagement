import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi, type CrmTask } from '../../services/task';
import { userApi } from '../../services/user';
import { customerApi } from '../../services/customer';
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
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Search, Plus, CheckCircle2, Clock, Play, XCircle, Edit3, X, Filter } from 'lucide-react';
import { mapTaskStatus, mapTaskPriority, formatUserName } from '../../utils/enum-mapper';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuthStore } from '../../app/store';
import { TableSkeleton } from '../../components/ui/skeletons';
import { EmptyState } from '../../components/ui/empty-state';
import { UserAvatar } from '../../components/ui/user-avatar';

export default function TaskListPage() {
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [assignedFilter, setAssignedFilter] = useState<string>('ALL');
  const [page, setPage] = useState(0);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<CrmTask | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCustomerId, setFormCustomerId] = useState<string>('');
  const [formAssignedUserId, setFormAssignedUserId] = useState<string>('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formPriority, setFormPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');

  // Fetch Users for assignment
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: userApi.getAll,
  });

  // Fetch Customers for optional linking
  const { data: customersData } = useQuery({
    queryKey: ['customers', { page: 0, size: 100 }],
    queryFn: () => customerApi.getAll(0, 100, ''),
  });
  const customers = customersData?.content || [];

  // Fetch Tasks
  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks', { search, statusFilter, priorityFilter, assignedFilter, page }],
    queryFn: () =>
      taskApi.getAll({
        search,
        status: statusFilter,
        priority: priorityFilter,
        assignedUserId: assignedFilter === 'MY' ? currentUser?.id : (assignedFilter === 'ALL' ? undefined : Number(assignedFilter)),
        page,
        size: 10,
      }),
  });

  // Status Change Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => taskApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Görev durumu güncellendi');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Görev durumu güncellenemedi');
    },
  });

  // Save Task Mutation
  const saveTaskMutation = useMutation({
    mutationFn: async () => {
      if (!formTitle.trim()) throw new Error('Başlık zorunludur.');
      if (!formAssignedUserId) throw new Error('Atanan kullanıcı seçilmelidir.');

      const payload = {
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        customerId: formCustomerId ? Number(formCustomerId) : undefined,
        assignedUserId: Number(formAssignedUserId),
        dueDate: formDueDate ? new Date(formDueDate).toISOString() : undefined,
        priority: formPriority,
      };

      if (editingTask) {
        return taskApi.update(editingTask.id, payload);
      } else {
        return taskApi.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(editingTask ? 'Görev güncellendi' : 'Yeni görev oluşturuldu');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Görev kaydedilemedi.');
    },
  });

  const resetForm = () => {
    setEditingTask(null);
    setFormTitle('');
    setFormDescription('');
    setFormCustomerId('');
    setFormAssignedUserId(currentUser?.id ? String(currentUser.id) : '');
    setFormDueDate('');
    setFormPriority('MEDIUM');
  };

  const handleOpenCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (task: CrmTask) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description || '');
    setFormCustomerId(task.customerId ? String(task.customerId) : '');
    setFormAssignedUserId(String(task.assignedUserId));
    setFormDueDate(task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd'T'HH:mm") : '');
    setFormPriority(task.priority);
    setIsDialogOpen(true);
  };

  const hasActiveFilters = search || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || assignedFilter !== 'ALL';

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setAssignedFilter('ALL');
    setPage(0);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Görev & İş Takibi</h1>
          <p className="text-xs text-slate-500 mt-1">Müşteri ve destek talepleriyle ilişkili aksiyon ve görevlerinizi yönetin.</p>
        </div>
        <Button onClick={handleOpenCreateDialog} className="bg-slate-900 hover:bg-slate-800 text-white gap-2 h-9 text-xs">
          <Plus className="h-4 w-4" />
          Yeni Görev Oluştur
        </Button>
      </div>

      {/* Filter Toolbar */}
      <Card className="border border-slate-200/80 shadow-2xs bg-white">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Görev, müşteri veya bilet no ara..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val || 'ALL'); setPage(0); }}>
              <SelectTrigger className="h-9 text-xs">
                <div className="flex items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5 text-slate-400" />
                  <SelectValue placeholder="Durum Filtresi" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tüm Durumlar</SelectItem>
                <SelectItem value="TODO">Yapılacak</SelectItem>
                <SelectItem value="IN_PROGRESS">Devam Ediyor</SelectItem>
                <SelectItem value="COMPLETED">Tamamlandı</SelectItem>
                <SelectItem value="CANCELLED">İptal Edildi</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={priorityFilter} onValueChange={(val) => { setPriorityFilter(val || 'ALL'); setPage(0); }}>
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

            {/* Assignment Filter */}
            <Select value={assignedFilter} onValueChange={(val) => { setAssignedFilter(val || 'ALL'); setPage(0); }}>
              <SelectTrigger className="h-9 text-xs">
                <div className="flex items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5 text-slate-400" />
                  <SelectValue placeholder="Atanan Filtresi" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tüm Kullanıcılar</SelectItem>
                <SelectItem value="MY">Benim Görevlerim</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {formatUserName(u.firstName, u.lastName)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">Aktif filtreler uygulanıyor</span>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1">
                <X className="h-3.5 w-3.5" />
                Filtreleri Temizle
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task List Table */}
      <Card className="border border-slate-200/80 shadow-2xs bg-white overflow-hidden">
        {isLoading ? (
          <TableSkeleton />
        ) : !tasksData || tasksData.content.length === 0 ? (
          <EmptyState
            title="Görev bulunamadı"
            description={hasActiveFilters ? 'Arama kriterlerinize uyan görev bulunamadı.' : 'Sistemde henüz oluşturulmuş bir görev bulunmuyor.'}
            actionLabel={hasActiveFilters ? 'Filtreleri Temizle' : 'Yeni Görev Oluştur'}
            onAction={hasActiveFilters ? clearFilters : handleOpenCreateDialog}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="crm-table-header">
                    <TableHead>Görev Başlığı</TableHead>
                    <TableHead>İlgili Varlık</TableHead>
                    <TableHead>Atanan Temsilci</TableHead>
                    <TableHead>Öncelik</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Son Tarih</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasksData.content.map((task) => {
                    const statusInfo = mapTaskStatus(task.status);
                    const priorityInfo = mapTaskPriority(task.priority);

                    return (
                      <TableRow key={task.id} className="hover:bg-slate-50/80 crm-transition text-xs">
                        <TableCell className="font-semibold text-slate-900 max-w-xs">
                          <div className="flex flex-col">
                            <span className="truncate">{task.title}</span>
                            {task.description && (
                              <span className="text-[11px] font-normal text-slate-500 line-clamp-1 mt-0.5">
                                {task.description}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {task.customerName ? (
                            <span className="font-medium text-slate-800">{task.customerName}</span>
                          ) : task.ticketNumber ? (
                            <Badge variant="outline" className="font-mono text-[10px]">{task.ticketNumber}</Badge>
                          ) : (
                            <span className="text-slate-400 italic">Genel Task</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserAvatar name={task.assignedUserName} size="sm" />
                            <span className="font-medium text-slate-700">{task.assignedUserName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] font-medium ${priorityInfo.bg}`}>
                            {priorityInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full ${statusInfo.dot}`} />
                            <span className="font-medium text-slate-700">{statusInfo.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {task.dueDate ? (
                            <div className="flex items-center gap-1 text-slate-600">
                              <Clock className={`h-3.5 w-3.5 ${task.isOverdue ? 'text-rose-500' : 'text-slate-400'}`} />
                              <span className={task.isOverdue ? 'text-rose-600 font-semibold' : ''}>
                                {format(new Date(task.dueDate), 'dd MMM yyyy, HH:mm', { locale: tr })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {task.status === 'TODO' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateStatusMutation.mutate({ id: task.id, status: 'IN_PROGRESS' })}
                                title="İşleme Al"
                                className="h-7 px-2 text-[11px] text-sky-600 hover:text-sky-700 hover:bg-sky-50 gap-1"
                              >
                                <Play className="h-3 w-3" /> İşleme Al
                              </Button>
                            )}
                            {(task.status === 'TODO' || task.status === 'IN_PROGRESS') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateStatusMutation.mutate({ id: task.id, status: 'COMPLETED' })}
                                title="Tamamla"
                                className="h-7 px-2 text-[11px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1"
                              >
                                <CheckCircle2 className="h-3 w-3" /> Tamamla
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenEditDialog(task)}
                              title="Düzenle"
                              className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            {task.status !== 'CANCELLED' && task.status !== 'COMPLETED' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateStatusMutation.mutate({ id: task.id, status: 'CANCELLED' })}
                                title="İptal Et"
                                className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {tasksData.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs">
                <span className="text-slate-500">
                  Toplam <span className="font-semibold text-slate-900">{tasksData.totalElements}</span> görevden {(page * 10) + 1} - {Math.min((page + 1) * 10, tasksData.totalElements)} gösteriliyor
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="h-8 text-xs"
                  >
                    Önceki
                  </Button>
                  <span className="text-slate-600 font-medium px-2">Sayfa {page + 1} / {tasksData.totalPages}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(tasksData.totalPages - 1, p + 1))}
                    disabled={page >= tasksData.totalPages - 1}
                    className="h-8 text-xs"
                  >
                    Sonraki
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingTask ? 'Görevi Düzenle' : 'Yeni Görev Oluştur'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Görev Başlığı *</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Örn: Müşteri ile fatura konusunu görüş"
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Açıklama</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Operasyonel adımlar ve detaylar..."
                rows={3}
                className="mt-1 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-700">Atanan Temsilci *</Label>
                <Select value={formAssignedUserId} onValueChange={(val) => setFormAssignedUserId(val || '')}>
                  <SelectTrigger className="mt-1 h-9 text-xs">
                    <SelectValue placeholder="Temsilci seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {formatUserName(u.firstName, u.lastName)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Öncelik *</Label>
                <Select value={formPriority} onValueChange={(val: any) => setFormPriority(val || 'MEDIUM')}>
                  <SelectTrigger className="mt-1 h-9 text-xs">
                    <SelectValue placeholder="Öncelik seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Düşük</SelectItem>
                    <SelectItem value="MEDIUM">Normal</SelectItem>
                    <SelectItem value="HIGH">Yüksek</SelectItem>
                    <SelectItem value="CRITICAL">Kritik</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-700">İlgili Müşteri (Opsiyonel)</Label>
                <Select value={formCustomerId} onValueChange={(val) => setFormCustomerId(val || '')}>
                  <SelectTrigger className="mt-1 h-9 text-xs">
                    <SelectValue placeholder="Müşteri seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Yok</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.firstName} {c.lastName} {c.company ? `(${c.company})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Son Tarih & Saat</Label>
                <Input
                  type="datetime-local"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)} className="h-8 text-xs">
              İptal
            </Button>
            <Button
              size="sm"
              onClick={() => saveTaskMutation.mutate()}
              disabled={saveTaskMutation.isPending}
              className="h-8 text-xs bg-slate-900 text-white hover:bg-slate-800"
            >
              {editingTask ? 'Kaydet' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
