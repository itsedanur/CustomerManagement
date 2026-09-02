import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { customerApi } from '../../services/customer';
import { addressApi, type Address } from '../../services/address';
import { ticketApi } from '../../services/ticket';
import { activityApi, type Activity } from '../../services/activity';
import { useAuthStore } from '../../app/store';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { StatusBadge } from '../../components/ui/status-badge';
import { PriorityBadge } from '../../components/ui/priority-badge';
import { UserAvatar } from '../../components/ui/user-avatar';
import { DetailSkeleton } from '../../components/ui/skeletons';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { mapCustomerType } from '../../utils/enum-mapper';

import {
  Mail,
  Phone,
  Building2,
  Calendar,
  MapPin,
  Plus,
  Trash2,
  Ticket as TicketIcon,
  Activity as ActivityIcon,
  ChevronLeft,
  Clock,
  CheckCircle2,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const customerId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [deleteAddressId, setDeleteAddressId] = useState<number | null>(null);

  // Address Form State
  const [addressForm, setAddressForm] = useState({
    title: '',
    addressLine: '',
    city: '',
    district: '',
    postalCode: '',
    country: 'Türkiye',
    addressType: 'WORK',
  });

  // Ticket Form State
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    description: '',
    priority: 'MEDIUM',
  });

  const { data: customer, isLoading: isCustomerLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customerApi.getById(customerId),
    enabled: !!customerId,
  });

  const { data: addresses, isLoading: isAddressesLoading } = useQuery({
    queryKey: ['addresses', customerId],
    queryFn: () => addressApi.getByCustomer(customerId),
    enabled: !!customerId,
  });

  const { data: tickets, isLoading: isTicketsLoading } = useQuery({
    queryKey: ['customerTickets', customerId],
    queryFn: () => ticketApi.getByCustomer(customerId),
    enabled: !!customerId,
  });

  const { data: activities, isLoading: isActivitiesLoading } = useQuery({
    queryKey: ['customerActivities', customerId],
    queryFn: () => activityApi.getByCustomer(customerId),
    enabled: !!customerId,
  });

  // Mutations
  const createAddressMutation = useMutation({
    mutationFn: (data: any) => addressApi.create(customerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customerActivities', customerId] });
      setIsAddressModalOpen(false);
      setAddressForm({ title: '', addressLine: '', city: '', district: '', postalCode: '', country: 'Türkiye', addressType: 'WORK' });
      toast.success('Adres başarıyla eklendi');
    },
    onError: () => toast.error('Adres eklenirken hata oluştu')
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (addressId: number) => addressApi.delete(customerId, addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customerActivities', customerId] });
      setDeleteAddressId(null);
      toast.success('Adres silindi');
    },
    onError: () => {
      setDeleteAddressId(null);
      toast.error('Adres silinirken hata oluştu');
    }
  });

  const createTicketMutation = useMutation({
    mutationFn: (data: any) => ticketApi.create(customerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerTickets', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customerActivities', customerId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      setIsTicketModalOpen(false);
      setTicketForm({ subject: '', description: '', priority: 'MEDIUM' });
      toast.success('Destek talebi başarıyla oluşturuldu');
    },
    onError: () => toast.error('Destek talebi oluşturulurken hata oluştu')
  });

  if (isCustomerLoading) {
    return <DetailSkeleton />;
  }

  if (!customer) {
    return (
      <div className="p-8 text-center text-slate-500">
        Müşteri bulunamadı.
      </div>
    );
  }

  const openTicketsCount = tickets?.content?.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length || 0;

  return (
    <div className="space-y-6">
      {/* Header & Back Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/customers')} className="h-9 w-9 text-slate-600">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="crm-page-title">{customer.firstName} {customer.lastName}</h1>
              <StatusBadge status={customer.status} />
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium border">
                {mapCustomerType(customer.customerType)}
              </span>
            </div>
            <p className="crm-secondary-text mt-1">{customer.company || 'Bireysel Müşteri'} • ID: #{customer.id}</p>
          </div>
        </div>
        
        {user?.role !== 'AGENT' && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/customers/${customer.id}/edit`)} className="h-9 text-xs">
              Müşteriyi Düzenle
            </Button>
            <Button size="sm" onClick={() => setIsTicketModalOpen(true)} className="h-9 text-xs bg-slate-900 text-white hover:bg-slate-800 gap-1.5">
              <Plus className="h-4 w-4" /> Talep Oluştur
            </Button>
          </div>
        )}
      </div>

      {/* CRM 360 Customer Overview Header Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-slate-200/80 shadow-xs bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <UserAvatar name={`${customer.firstName} ${customer.lastName}`} size="lg" />
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Müşteri Profili</p>
              <h4 className="text-sm font-bold text-slate-900">{customer.firstName} {customer.lastName}</h4>
              <p className="text-xs text-slate-500">{customer.company}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-xs bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Toplam Talep</p>
              <h4 className="text-xl font-bold text-slate-900 mt-0.5">{tickets?.totalElements || 0}</h4>
            </div>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <TicketIcon className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-xs bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Açık Talepler</p>
              <h4 className="text-xl font-bold text-amber-600 mt-0.5">{openTicketsCount}</h4>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-xs bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Kayıt Tarihi</p>
              <h4 className="text-xs font-bold text-slate-900 mt-1">
                {customer.createdAt ? format(new Date(customer.createdAt), 'dd MMM yyyy', { locale: tr }) : '-'}
              </h4>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Calendar className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Layout */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-slate-100/80 p-1 border border-slate-200/80 rounded-lg">
          <TabsTrigger value="overview" className="text-xs font-medium">Genel Bilgiler</TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs font-medium">Aktivite Zaman Çizelgesi</TabsTrigger>
          <TabsTrigger value="tickets" className="text-xs font-medium">Destek Talepleri ({tickets?.totalElements || 0})</TabsTrigger>
          <TabsTrigger value="addresses" className="text-xs font-medium">Adresler ({addresses?.length || 0})</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card className="border border-slate-200/80 shadow-xs bg-white">
            <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/40">
              <CardTitle className="text-sm font-semibold text-slate-900">İletişim & Profil Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="font-semibold text-slate-900 w-24">E-posta:</span>
                  <span>{customer.email}</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="font-semibold text-slate-900 w-24">Telefon:</span>
                  <span>{customer.phone}</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <span className="font-semibold text-slate-900 w-24">Şirket:</span>
                  <span>{customer.company}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 text-slate-700">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="font-semibold text-slate-900 w-24">Müşteri Tipi:</span>
                  <span>{mapCustomerType(customer.customerType)}</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-slate-400" />
                  <span className="font-semibold text-slate-900 w-24">Durum:</span>
                  <StatusBadge status={customer.status} />
                </div>
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="font-semibold text-slate-900 w-24">Oluşturulma:</span>
                  <span>{customer.createdAt ? format(new Date(customer.createdAt), 'dd MMMM yyyy, HH:mm', { locale: tr }) : '-'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Activity Timeline */}
        <TabsContent value="timeline" className="mt-4">
          <Card className="border border-slate-200/80 shadow-xs bg-white">
            <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/40">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <ActivityIcon className="h-4 w-4 text-indigo-600" /> Aktivite Zaman Çizelgesi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isActivitiesLoading ? (
                <div className="text-center text-xs text-slate-400">Yükleniyor...</div>
              ) : !activities || activities.length === 0 ? (
                <div className="text-center text-xs text-slate-500 py-6">
                  Bu müşteriye ait henüz aktivite kaydı bulunmuyor.
                </div>
              ) : (
                <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
                  {activities.map((act: Activity) => (
                    <div key={act.id} className="relative group">
                      <div className="absolute -left-[31px] top-0.5 h-4 w-4 rounded-full bg-indigo-600 border-2 border-white shadow-xs" />
                      <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-100 hover:border-slate-200 crm-transition">
                        <p className="text-xs font-semibold text-slate-900">{act.description}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3 text-slate-400" /> {act.performedBy?.name || 'Sistem'}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" /> {format(new Date(act.createdAt), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Tickets */}
        <TabsContent value="tickets" className="mt-4">
          <Card className="border border-slate-200/80 shadow-xs bg-white">
            <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/40 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-900">Müşterinin Destek Talepleri</CardTitle>
              {user?.role !== 'AGENT' && (
                <Button size="sm" onClick={() => setIsTicketModalOpen(true)} className="h-8 text-xs bg-slate-900 text-white hover:bg-slate-800 gap-1">
                  <Plus className="h-3.5 w-3.5" /> Yeni Talep
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {isTicketsLoading ? (
                <div className="p-6 text-center text-xs text-slate-400">Talepler yükleniyor...</div>
              ) : !tickets?.content || tickets.content.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Bu müşteriye ait henüz destek talebi bulunmuyor.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="crm-table-header border-b border-slate-100">
                        <th className="p-3 pl-4">Talep NO</th>
                        <th className="p-3">Konu</th>
                        <th className="p-3">Durum</th>
                        <th className="p-3">Öncelik</th>
                        <th className="p-3">Oluşturulma</th>
                        <th className="p-3 text-right pr-4">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tickets.content.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/80 crm-transition">
                          <td className="p-3 pl-4 font-mono font-semibold text-slate-900">{t.ticketNumber}</td>
                          <td className="p-3 font-medium text-slate-800">{t.subject}</td>
                          <td className="p-3"><StatusBadge status={t.status} /></td>
                          <td className="p-3"><PriorityBadge priority={t.priority} /></td>
                          <td className="p-3 text-slate-500">{format(new Date(t.createdAt), 'dd MMM yyyy', { locale: tr })}</td>
                          <td className="p-3 pr-4 text-right">
                            <Button variant="outline" size="sm" onClick={() => navigate(`/tickets/${t.id}`)} className="h-7 text-[11px]">
                              Detay
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Addresses */}
        <TabsContent value="addresses" className="mt-4">
          <Card className="border border-slate-200/80 shadow-xs bg-white">
            <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/40 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-900">Müşteri Adresleri</CardTitle>
              {user?.role !== 'AGENT' && (
                <Button size="sm" onClick={() => setIsAddressModalOpen(true)} className="h-8 text-xs bg-slate-900 text-white hover:bg-slate-800 gap-1">
                  <Plus className="h-3.5 w-3.5" /> Adres Ekle
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-4">
              {isAddressesLoading ? (
                <div className="text-center text-xs text-slate-400">Adresler yükleniyor...</div>
              ) : !addresses || addresses.length === 0 ? (
                <div className="text-center text-xs text-slate-500 py-6">
                  Bu müşteriye kayıtlı adres bulunmamaktadır.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr: Address) => (
                    <div key={addr.id} className="p-4 rounded-lg border border-slate-200/80 bg-slate-50/40 relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-indigo-600" /> {addr.title}
                        </span>
                        {user?.role === 'ADMIN' && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteAddressId(addr.id)}
                            className="h-7 w-7 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-slate-700">{addr.addressLine}</p>
                      <p className="text-xs text-slate-500 mt-1 font-medium">{addr.district} / {addr.city} - {addr.postalCode}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Address Dialog */}
      <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Yeni Adres Ekle</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">Müşteriye yeni bir adres bilgisi tanımlayın.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div>
              <Label className="text-xs">Adres Başlığı *</Label>
              <Input
                placeholder="Örn: Merkez Ofis, Depo"
                value={addressForm.title}
                onChange={(e) => setAddressForm({ ...addressForm, title: e.target.value })}
                className="h-9 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Adres Satırı *</Label>
              <Input
                placeholder="Sokak, Mahalle, Bina No"
                value={addressForm.addressLine}
                onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })}
                className="h-9 text-xs mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">İl *</Label>
                <Input
                  placeholder="İstanbul"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  className="h-9 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">İlçe *</Label>
                <Input
                  placeholder="Kadıköy"
                  value={addressForm.district}
                  onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
                  className="h-9 text-xs mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsAddressModalOpen(false)}>İptal</Button>
            <Button size="sm" onClick={() => createAddressMutation.mutate(addressForm)} disabled={createAddressMutation.isPending}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Ticket Dialog */}
      <Dialog open={isTicketModalOpen} onOpenChange={setIsTicketModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Yeni Destek Talepleri</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">Müşteri için yeni destek bileti oluşturun.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div>
              <Label className="text-xs">Konu *</Label>
              <Input
                placeholder="Sorun özeti..."
                value={ticketForm.subject}
                onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                className="h-9 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Açıklama *</Label>
              <Input
                placeholder="Detaylı açıklama..."
                value={ticketForm.description}
                onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                className="h-9 text-xs mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsTicketModalOpen(false)}>İptal</Button>
            <Button size="sm" onClick={() => createTicketMutation.mutate(ticketForm)} disabled={createTicketMutation.isPending}>
              Talebi Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Address Deletion */}
      <ConfirmDialog
        open={deleteAddressId !== null}
        onOpenChange={(open) => !open && setDeleteAddressId(null)}
        title="Adresi Sil"
        description="Bu adresi silmek istediğinizden emin misiniz?"
        confirmText="Sil"
        variant="destructive"
        onConfirm={() => deleteAddressId && deleteAddressMutation.mutate(deleteAddressId)}
        isLoading={deleteAddressMutation.isPending}
      />
    </div>
  );
}
