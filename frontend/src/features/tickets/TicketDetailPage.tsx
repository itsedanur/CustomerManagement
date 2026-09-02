import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router';
import { ticketApi } from '../../services/ticket';
import { userApi } from '../../services/user';
import { useAuthStore } from '../../app/store';
import { ticketNoteApi } from '../../services/ticketNote';
import { activityApi } from '../../services/activity';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  CheckCircle2,
  Play,
  UserPlus,
  RefreshCcw,
  XCircle,
  ArrowLeft,
  MessageSquare,
  Activity as ActivityIcon,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';
import { StatusBadge } from '../../components/ui/status-badge';
import { PriorityBadge } from '../../components/ui/priority-badge';
import { DetailSkeleton } from '../../components/ui/skeletons';
import { EmptyState } from '../../components/ui/empty-state';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { UserAvatar } from '../../components/ui/user-avatar';

export default function TicketDetailPage() {
  const { id } = useParams();
  const ticketId = Number(id);
  const navigate = useNavigate();
  
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [assigneeId, setAssigneeId] = useState<string>('');
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');

  const { data: ticket, isLoading: isTicketLoading } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => ticketApi.getById(ticketId),
  });

  const { data: assignableUsers } = useQuery({
    queryKey: ['assignableUsers'],
    queryFn: userApi.getAssignable,
    enabled: user?.role === 'ADMIN' || user?.role === 'MANAGER',
  });

  const { data: ticketNotes = [], isLoading: isNotesLoading } = useQuery({
    queryKey: ['ticketNotes', ticketId],
    queryFn: () => ticketNoteApi.getByTicketId(ticketId),
    enabled: !!ticketId,
  });

  const { data: ticketActivities = [], isLoading: isActivitiesLoading } = useQuery({
    queryKey: ['ticketActivities', ticketId],
    queryFn: () => activityApi.getByTicket(ticketId),
    enabled: !!ticketId,
  });

  const createNoteMutation = useMutation({
    mutationFn: (content: string) => ticketNoteApi.create(ticketId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticketNotes', ticketId] });
      setNewNoteContent('');
      toast.success('İç not eklendi');
    },
    onError: () => toast.error('İç not eklenemedi')
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: number) => ticketNoteApi.delete(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticketNotes', ticketId] });
      toast.success('İç not silindi');
    },
    onError: () => toast.error('İç not silinemedi')
  });

  const assignMutation = useMutation({
    mutationFn: (userId: number) => ticketApi.assign(ticketId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      toast.success('Destek talebi başarıyla atandı.');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Atama işlemi başarısız.');
    }
  });

  const priorityMutation = useMutation({
    mutationFn: (newPriority: string) => ticketApi.changePriority(ticketId, newPriority),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      toast.success('Öncelik başarıyla güncellendi.');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Öncelik güncelleme başarısız.');
    }
  });

  const actionMutation = useMutation({
    mutationFn: (action: 'start' | 'resolve' | 'reopen' | 'close') => {
      switch (action) {
        case 'start': return ticketApi.startProgress(ticketId);
        case 'resolve': return ticketApi.resolve(ticketId);
        case 'reopen': return ticketApi.reopen(ticketId);
        case 'close': return ticketApi.close(ticketId);
      }
    },
    onSuccess: (_, action) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['customerTickets', ticket?.customer?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      
      const messages: Record<string, string> = {
        'start': 'Destek talebi işleme alındı.',
        'resolve': 'Destek talebi çözüldü.',
        'reopen': 'Destek talebi yeniden açıldı.',
        'close': 'Destek talebi kapatıldı.'
      };
      toast.success(messages[action]);
      setIsCloseModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'İşlem gerçekleştirilemedi.');
      setIsCloseModalOpen(false);
    }
  });

  const handleAssign = () => {
    if (assigneeId) {
      assignMutation.mutate(Number(assigneeId));
    }
  };

  const handlePriorityChange = (val: string | null) => {
    if (val) {
      priorityMutation.mutate(val);
    }
  };

  if (isTicketLoading) return <DetailSkeleton />;
  if (!ticket) return (
    <EmptyState
      title="Destek talebi bulunamadı"
      description="İstediğiniz destek kaydı mevcut değil veya kaldırılmış."
      actionLabel="Taleplere Dön"
      onAction={() => navigate('/tickets')}
    />
  );

  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const assignedUser = assignableUsers?.find(u => u.id === ticket.assignedUserId);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/tickets')}
            className="h-8 text-xs gap-1 text-slate-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Destek Taleplerine Dön
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="crm-page-title font-mono">{ticket.ticketNumber}</h1>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <p className="crm-secondary-text mt-0.5">{ticket.subject}</p>
          </div>
        </div>

        {/* State Transition Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {ticket.status === 'OPEN' && (
            <Button size="sm" onClick={() => actionMutation.mutate('start')} disabled={actionMutation.isPending} className="bg-sky-600 hover:bg-sky-700 text-white h-8 text-xs gap-1.5 shadow-xs">
              <Play className="h-3.5 w-3.5" /> İşleme Al
            </Button>
          )}
          {ticket.status === 'IN_PROGRESS' && (
            <Button size="sm" onClick={() => actionMutation.mutate('resolve')} disabled={actionMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs gap-1.5 shadow-xs">
              <CheckCircle2 className="h-3.5 w-3.5" /> Çözüldü İşaretle
            </Button>
          )}
          {ticket.status === 'RESOLVED' && (
            <Button size="sm" variant="outline" onClick={() => actionMutation.mutate('reopen')} disabled={actionMutation.isPending} className="h-8 text-xs gap-1.5">
              <RefreshCcw className="h-3.5 w-3.5 text-slate-500" /> Yeniden Aç
            </Button>
          )}
          {ticket.status !== 'CLOSED' && (
            <Button size="sm" variant="secondary" onClick={() => setIsCloseModalOpen(true)} className="h-8 text-xs gap-1.5 text-slate-700">
              <XCircle className="h-3.5 w-3.5 text-slate-500" /> Talebi Kapat
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Details Box */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200/80 shadow-xs bg-white">
            <CardHeader className="border-b border-slate-100 py-3.5">
              <CardTitle className="text-sm font-semibold text-slate-900">Talep Açıklaması & İçeriği</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <h2 className="text-base font-bold text-slate-900 mb-3">{ticket.subject}</h2>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </div>
            </CardContent>
          </Card>

          {/* Customer Card */}
          {ticket.customer && (
            <Card className="border border-slate-200/80 shadow-xs bg-white">
              <CardHeader className="border-b border-slate-100 py-3.5 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold text-slate-900">İlişkili Müşteri</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate(`/customers/${ticket.customer.id}`)}
                  className="h-7 text-xs text-slate-600 hover:text-slate-900"
                >
                  Müşteri Profiline Git
                </Button>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <UserAvatar name={`${ticket.customer.firstName} ${ticket.customer.lastName}`} size="md" />
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{ticket.customer.firstName} {ticket.customer.lastName}</h3>
                    <p className="text-[11px] text-slate-500">Müşteri ID: #{ticket.customer.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Internal Operational Notes Card */}
          <Card className="border border-slate-200/80 shadow-xs bg-white">
            <CardHeader className="border-b border-slate-100 py-3.5">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-sky-600" /> Temsilci İç Notları
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Add Note Form */}
              <div className="space-y-2 bg-slate-50/60 p-3 rounded-lg border border-slate-200/80">
                <label className="text-xs font-semibold text-slate-800">Talebine Özel İç Not Ekle</label>
                <Textarea
                  placeholder="Ekip içi not ve güncellemelerinizi yazın..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  rows={3}
                  className="text-xs bg-white"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => newNoteContent.trim() && createNoteMutation.mutate(newNoteContent.trim())}
                    disabled={!newNoteContent.trim() || createNoteMutation.isPending}
                    className="h-8 text-xs bg-slate-900 text-white hover:bg-slate-800"
                  >
                    Notu Kaydet
                  </Button>
                </div>
              </div>

              {/* Internal Notes List */}
              {isNotesLoading ? (
                <div className="text-center text-xs text-slate-400 py-3">İç notlar yükleniyor...</div>
              ) : ticketNotes.length === 0 ? (
                <div className="text-center text-xs text-slate-500 py-4">
                  Bu talebe henüz iç not eklenmemiş.
                </div>
              ) : (
                <div className="space-y-3">
                  {ticketNotes.map((note) => (
                    <div key={note.id} className="p-3.5 rounded-lg border border-slate-200/80 bg-white hover:border-slate-300 crm-transition">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2 text-xs">
                        <div className="flex items-center gap-2">
                          <UserAvatar name={note.authorName} size="sm" />
                          <span className="font-bold text-slate-900">{note.authorName}</span>
                          <span className="text-[11px] text-slate-400">• {format(new Date(note.createdAt), 'dd MMM yyyy, HH:mm', { locale: tr })}</span>
                        </div>
                        {(user?.role === 'ADMIN' || user?.role === 'MANAGER' || note.authorUserId === user?.id) && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteNoteMutation.mutate(note.id)}
                            className="h-6 w-6 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ticket Activity History Timeline Card */}
          <Card className="border border-slate-200/80 shadow-xs bg-white">
            <CardHeader className="border-b border-slate-100 py-3.5">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <ActivityIcon className="h-4 w-4 text-indigo-600" /> Talep İşlem Geçmişi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {isActivitiesLoading ? (
                <div className="text-center text-xs text-slate-400 py-3">İşlem geçmişi yükleniyor...</div>
              ) : ticketActivities.length === 0 ? (
                <div className="text-center text-xs text-slate-500 py-4">
                  Henüz bir işlem kaydı yok.
                </div>
              ) : (
                <div className="relative pl-5 border-l-2 border-slate-200 space-y-4">
                  {ticketActivities.map((act) => (
                    <div key={act.id} className="relative">
                      <div className="absolute -left-[27px] top-1 h-3.5 w-3.5 rounded-full bg-slate-800 border-2 border-white shadow-xs" />
                      <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100 text-xs">
                        <p className="font-semibold text-slate-900">{act.description}</p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {act.performedBy?.name || 'Sistem'} • {format(new Date(act.createdAt), 'dd MMM yyyy, HH:mm', { locale: tr })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Management Box */}
        <div className="space-y-6">
          {/* Assignment & Priority Settings Card */}
          {canManage && (
            <Card className="border border-slate-200/80 shadow-xs bg-white">
              <CardHeader className="border-b border-slate-100 py-3.5">
                <CardTitle className="text-sm font-semibold text-slate-900">Yönetim & Atama</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Temsilciye Ata</label>
                  <div className="flex gap-2">
                    <Select value={assigneeId} onValueChange={(val: string | null) => setAssigneeId(val || '')}>
                      <SelectTrigger className="h-9 text-xs flex-1">
                        <SelectValue placeholder={assignedUser ? `${assignedUser.firstName} ${assignedUser.lastName}` : "Kullanıcı seçiniz..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {assignableUsers?.map(u => (
                          <SelectItem key={u.id} value={u.id.toString()}>
                            {u.firstName} {u.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={handleAssign} disabled={!assigneeId || assignMutation.isPending} className="h-9 text-xs bg-slate-900 text-white">
                      <UserPlus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <label className="text-xs font-semibold text-slate-700">Öncelik Değiştir</label>
                  <Select value={ticket.priority} onValueChange={handlePriorityChange}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Öncelik seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Düşük</SelectItem>
                      <SelectItem value="MEDIUM">Normal</SelectItem>
                      <SelectItem value="HIGH">Yüksek</SelectItem>
                      <SelectItem value="CRITICAL">Kritik</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ticket Information Summary Card */}
          <Card className="border border-slate-200/80 shadow-xs bg-white">
            <CardHeader className="border-b border-slate-100 py-3.5">
              <CardTitle className="text-sm font-semibold text-slate-900">Talep Detayları</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Atanan Temsilci:</span>
                <span className="font-semibold text-slate-900">
                  {assignedUser ? `${assignedUser.firstName} ${assignedUser.lastName}` : (ticket.assignedUserId ? `Kullanıcı #${ticket.assignedUserId}` : 'Atanmadı')}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Oluşturulma:</span>
                <span className="font-medium text-slate-700">
                  {format(new Date(ticket.createdAt), 'dd MMM yyyy, HH:mm', { locale: tr })}
                </span>
              </div>
              {ticket.updatedAt && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Son Güncelleme:</span>
                  <span className="font-medium text-slate-700">
                    {format(new Date(ticket.updatedAt), 'dd MMM yyyy, HH:mm', { locale: tr })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirm Close Modal */}
      <ConfirmDialog
        open={isCloseModalOpen}
        onOpenChange={setIsCloseModalOpen}
        title="Destek Talebini Kapat"
        description="Bu destek talebini kapatmak istediğinize emin misiniz? Kapatılan talepler pasif statüye alınır."
        confirmText="Talebi Kapat"
        variant="destructive"
        onConfirm={() => actionMutation.mutate('close')}
        isLoading={actionMutation.isPending}
      />
    </div>
  );
}
