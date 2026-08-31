import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { ticketApi } from '../../services/ticket';
import { userApi } from '../../services/user';
import { useAuthStore } from '../../app/store';

import { Card, CardContent, CardHeader, CardTitle, } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { CheckCircle2, Play, UserPlus, RefreshCcw, XCircle } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';

export default function TicketDetailPage() {
  const { id } = useParams();
  const ticketId = Number(id);
  
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [assigneeId, setAssigneeId] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  const { data: ticket, isLoading: isTicketLoading } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => ticketApi.getById(ticketId),
  });

  const { data: assignableUsers } = useQuery({
    queryKey: ['assignableUsers'],
    queryFn: userApi.getAssignable,
    enabled: user?.role === 'ADMIN' || user?.role === 'MANAGER',
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
      
      const messages: Record<string, string> = {
        'start': 'Destek talebi işleme alındı.',
        'resolve': 'Destek talebi çözüldü.',
        'reopen': 'Destek talebi yeniden açıldı.',
        'close': 'Destek talebi kapatıldı.'
      };
      toast.success(messages[action]);
      
      if (action === 'close') {
        setIsCloseModalOpen(false);
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'İşlem başarısız.');
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
      setPriority(val);
      priorityMutation.mutate(val);
    }
  };

  const getPriorityBadgeTr = (priority: string) => {
    switch(priority) {
      case 'LOW': return 'DÜŞÜK';
      case 'MEDIUM': return 'ORTA';
      case 'HIGH': return 'YÜKSEK';
      case 'CRITICAL': return 'KRİTİK';
      default: return priority;
    }
  };

  const getStatusBadgeTr = (status: string) => {
    switch(status) {
      case 'OPEN': return 'AÇIK';
      case 'IN_PROGRESS': return 'İŞLEMDE';
      case 'RESOLVED': return 'ÇÖZÜLDÜ';
      case 'CLOSED': return 'KAPALI';
      default: return status;
    }
  };

  if (isTicketLoading) return <div className="p-8 text-center text-slate-500">Destek talebi yükleniyor...</div>;
  if (!ticket) return <div className="p-8 text-center text-red-500">Destek talebi bulunamadı.</div>;

  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const assignedUser = assignableUsers?.find(u => u.id === ticket.assignedUserId);

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`${ticket.ticketNumber} - ${ticket.subject}`}
        backUrl="/tickets"
        breadcrumbs={[
          { label: 'Destek Talepleri', href: '/tickets' },
          { label: ticket.ticketNumber }
        ]}
        actions={
          <>
            {ticket.status === 'OPEN' && (
              <Button onClick={() => actionMutation.mutate('start')} disabled={actionMutation.isPending}>
                <Play className="h-4 w-4 mr-2" /> İşleme Al
              </Button>
            )}
            {ticket.status === 'IN_PROGRESS' && (
              <Button onClick={() => actionMutation.mutate('resolve')} disabled={actionMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle2 className="mr-2 h-4 w-4" /> Çöz
              </Button>
            )}
            {ticket.status === 'RESOLVED' && (
              <Button onClick={() => actionMutation.mutate('reopen')} disabled={actionMutation.isPending} variant="outline">
                <RefreshCcw className="mr-2 h-4 w-4" /> Yeniden Aç
              </Button>
            )}
            {ticket.status !== 'CLOSED' && (
              <Dialog open={isCloseModalOpen} onOpenChange={setIsCloseModalOpen}>
                <DialogTrigger>
                  <Button variant="secondary">
                    <XCircle className="mr-2 h-4 w-4" /> Kapat
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Talebi kapatmak istediğinize emin misiniz?</DialogTitle>
                    <DialogDescription>
                      Bu işlem talebi sonlandıracaktır. Kapatıldıktan sonra tekrar üzerinde işlem yapılamayabilir.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCloseModalOpen(false)}>İptal</Button>
                    <Button variant="destructive" onClick={() => actionMutation.mutate('close')} disabled={actionMutation.isPending}>
                      {actionMutation.isPending ? 'Kapatılıyor...' : 'Kapat'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </>
        }
      />

      <Card>
        <CardHeader className="flex flex-row items-start justify-between pb-4">
          <div className="space-y-1">
            <CardTitle className="text-xl">{ticket.subject}</CardTitle>
            <div className="text-sm text-slate-500">
              Oluşturulma: {format(new Date(ticket.createdAt), 'dd MMMM yyyy, HH:mm', { locale: tr })} • Müşteri: {ticket.customer.firstName} {ticket.customer.lastName}
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge className={
              ticket.status === 'OPEN' ? 'bg-blue-500' :
              ticket.status === 'IN_PROGRESS' ? 'bg-amber-500' :
              ticket.status === 'RESOLVED' ? 'bg-emerald-500' : 'bg-slate-500'
            }>
              {getStatusBadgeTr(ticket.status)}
            </Badge>
            <Badge variant="outline">{getPriorityBadgeTr(ticket.priority)}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-md border text-sm text-slate-800 whitespace-pre-wrap">
            {ticket.description}
          </div>

          {canManage && (
            <div className="flex flex-col gap-4 p-4 border rounded-md bg-slate-50">
              
              <div className="flex items-end gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium">Ata</label>
                  <Select value={assigneeId} onValueChange={(val: string | null) => { if (val) setAssigneeId(val); }}>
                    <SelectTrigger>
                      <SelectValue placeholder={assignedUser ? `${assignedUser.firstName} ${assignedUser.lastName}` : "Kullanıcı seçin..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {assignableUsers?.map(u => (
                        <SelectItem key={u.id} value={u.id.toString()}>
                          {u.firstName} {u.lastName} ({u.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAssign} disabled={!assigneeId || assignMutation.isPending}>
                  <UserPlus className="h-4 w-4 mr-2" /> Ata
                </Button>
              </div>

              <div className="flex items-end gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium">Öncelik Değiştir</label>
                  <Select value={priority || ticket.priority} onValueChange={handlePriorityChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Öncelik seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Düşük</SelectItem>
                      <SelectItem value="MEDIUM">Orta</SelectItem>
                      <SelectItem value="HIGH">Yüksek</SelectItem>
                      <SelectItem value="CRITICAL">Kritik</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

            </div>
          )}

          {!canManage && ticket.assignedUserId && (
            <div className="text-sm">
              <span className="font-medium">Atanan Kişi:</span> Kullanıcı ID {ticket.assignedUserId}
            </div>
          )}
        </CardContent>

      </Card>
    </div>
  );
}
