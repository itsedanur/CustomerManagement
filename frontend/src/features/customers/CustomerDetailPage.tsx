import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

import { customerApi } from '../../services/customer';
import { addressApi } from '../../services/address';
import { ticketApi } from '../../services/ticket';
import { activityApi } from '../../services/activity';
import { useAuthStore } from '../../app/store';

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Plus, PlusCircle, Trash2, Ticket as TicketIcon, Building2, Mail, Phone, Edit, ArrowLeft, Clock, History, MapPin, UserCheck, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from '../../components/ui/status-badge';
import { PriorityBadge } from '../../components/ui/priority-badge';
import { UserAvatar } from '../../components/ui/user-avatar';
import { DetailSkeleton } from '../../components/ui/skeletons';
import { EmptyState } from '../../components/ui/empty-state';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';

// Address Schema
const addressSchema = z.object({
  title: z.string().min(1, 'Başlık zorunludur'),
  addressType: z.enum(['HOME', 'WORK', 'BILLING', 'SHIPPING', 'OTHER']),
  addressLine: z.string().min(1, 'Adres satırı zorunludur'),
  city: z.string().min(1, 'Şehir zorunludur'),
  district: z.string().min(1, 'İlçe zorunludur'),
  postalCode: z.string().min(1, 'Posta kodu zorunludur'),
  country: z.string().min(1, 'Ülke zorunludur'),
});

type AddressFormValues = z.infer<typeof addressSchema>;

// Ticket Schema
const ticketSchema = z.object({
  subject: z.string().min(1, 'Konu zorunludur'),
  description: z.string().min(1, 'Açıklama zorunludur'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
});

type TicketFormValues = z.infer<typeof ticketSchema>;

export default function CustomerDetailPage() {
  const { id } = useParams();
  const customerId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  const [deleteAddressId, setDeleteAddressId] = useState<number | null>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const canDelete = user?.role === 'ADMIN';

  // Address Form
  const addressForm = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      title: '',
      addressType: 'WORK',
      addressLine: '',
      city: '',
      district: '',
      postalCode: '',
      country: '',
    },
  });

  // Ticket Form
  const ticketForm = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      subject: '',
      description: '',
      priority: 'MEDIUM',
    },
  });

  // Queries
  const { data: customer, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customerApi.getById(customerId),
  });

  const { data: addresses, isLoading: isLoadingAddresses } = useQuery({
    queryKey: ['customerAddresses', customerId],
    queryFn: () => addressApi.getByCustomer(customerId),
  });

  const { data: tickets, isLoading: isLoadingTickets } = useQuery({
    queryKey: ['customerTickets', customerId],
    queryFn: () => ticketApi.getByCustomer(customerId, 0, 50),
  });

  const { data: activities, isLoading: isLoadingActivities } = useQuery({
    queryKey: ['customerActivities', customerId],
    queryFn: () => activityApi.getByCustomer(customerId),
  });

  // Mutations
  const createAddressMutation = useMutation({
    mutationFn: (values: AddressFormValues) => addressApi.create(customerId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerAddresses', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customerActivities', customerId] });
      setIsAddressModalOpen(false);
      addressForm.reset();
      toast.success('Adres başarıyla eklendi.');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Adres eklenirken bir hata oluştu.');
    }
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (addressId: number) => addressApi.delete(customerId, addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerAddresses', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customerActivities', customerId] });
      setDeleteAddressId(null);
      toast.success('Adres başarıyla silindi.');
    },
    onError: () => {
      setDeleteAddressId(null);
      toast.error('Bu adres silinemez.');
    }
  });

  const createTicketMutation = useMutation({
    mutationFn: (values: TicketFormValues) => ticketApi.create(customerId, values),
    onSuccess: (newTicket) => {
      queryClient.invalidateQueries({ queryKey: ['customerTickets', customerId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['customerActivities', customerId] });
      setIsTicketModalOpen(false);
      ticketForm.reset();
      toast.success('Destek talebi başarıyla oluşturuldu.');
      navigate(`/tickets/${newTicket.id}`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Destek talebi oluşturulurken bir hata oluştu.');
    }
  });

  if (isLoadingCustomer) {
    return <DetailSkeleton />;
  }

  if (!customer) {
    return (
      <EmptyState
        title="Müşteri bulunamadı"
        description="Talep edilen müşteri sistemde kayıtlı değil veya silinmiş olabilir."
        actionLabel="Müşterilere Dön"
        onAction={() => navigate('/customers')}
      />
    );
  }

  const getCustomerTypeTr = (type: string) => {
    switch (type) {
      case 'INDIVIDUAL': return 'Bireysel';
      case 'CORPORATE': return 'Kurumsal';
      default: return type;
    }
  };

  const getActivityTitle = (type: string) => {
    switch(type) {
      case 'CUSTOMER_CREATED': return 'Müşteri hesabı oluşturuldu';
      case 'CUSTOMER_UPDATED': return 'Müşteri bilgileri güncellendi';
      case 'ADDRESS_ADDED': return 'Yeni adres eklendi';
      case 'ADDRESS_UPDATED': return 'Adres bilgisi güncellendi';
      case 'ADDRESS_DELETED': return 'Adres silindi';
      case 'TICKET_CREATED': return 'Yeni destek talebi oluşturuldu';
      case 'TICKET_ASSIGNED': return 'Destek talebi atandı';
      case 'TICKET_STARTED': return 'Destek talebi işleme alındı';
      case 'TICKET_RESOLVED': return 'Destek talebi çözüldü';
      case 'TICKET_REOPENED': return 'Destek talebi yeniden açıldı';
      case 'TICKET_CLOSED': return 'Destek talebi kapatıldı';
      case 'TICKET_PRIORITY_CHANGED': return 'Destek talebi önceliği değiştirildi';
      case 'TICKET_STATUS_CHANGED': return 'Destek talebi durumu değiştirildi';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/customers')}
            className="h-8 text-xs gap-1 text-slate-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Müşterilere Dön
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="crm-page-title">{customer.firstName} {customer.lastName}</h1>
              <StatusBadge status={customer.status} />
            </div>
            <p className="crm-secondary-text mt-0.5">{customer.company ? `${customer.company} • ` : ''}{getCustomerTypeTr(customer.customerType)} Müşteri</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canManage && (
            <Button variant="outline" size="sm" onClick={() => navigate(`/customers/${customer.id}/edit`)} className="h-8 text-xs gap-1.5">
              <Edit className="h-3.5 w-3.5 text-slate-500" /> Düzenle
            </Button>
          )}
          {canManage && (
            <Button size="sm" onClick={() => setIsTicketModalOpen(true)} className="bg-slate-900 text-white hover:bg-slate-800 h-8 text-xs gap-1.5">
              <PlusCircle className="h-3.5 w-3.5" /> Destek Talebi Oluştur
            </Button>
          )}
        </div>
      </div>

      {/* Main Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1 border border-slate-200/80 shadow-xs bg-white h-fit">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-sm font-semibold text-slate-900">Müşteri Profil Özeti</CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-5">
            <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100">
              <UserAvatar name={`${customer.firstName} ${customer.lastName}`} size="lg" className="mb-3" />
              <h2 className="text-base font-bold text-slate-900">{customer.firstName} {customer.lastName}</h2>
              {customer.company && <p className="text-xs text-slate-500 font-medium mt-0.5">{customer.company}</p>}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-400" /> E-posta:
                </span>
                <span className="font-medium text-slate-900 truncate max-w-[180px]">{customer.email}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400" /> Telefon:
                </span>
                <span className="font-medium text-slate-900">{customer.phone}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-2">
                  <UserCheck className="h-3.5 w-3.5 text-slate-400" /> Tip:
                </span>
                <span className="font-medium text-slate-900">{getCustomerTypeTr(customer.customerType)}</span>
              </div>
            </div>
            
            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Oluşturulma:</span>
                <span>{format(new Date(customer.createdAt), 'dd MMM yyyy, HH:mm', { locale: tr })}</span>
              </div>
              <div className="flex justify-between">
                <span>Son Güncelleme:</span>
                <span>{format(new Date(customer.updatedAt), 'dd MMM yyyy, HH:mm', { locale: tr })}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Section Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="activities" className="w-full">
            <TabsList className="w-full grid grid-cols-3 bg-slate-100 p-1 rounded-xl">
              <TabsTrigger value="activities" className="text-xs font-medium gap-1.5">
                <Activity className="h-3.5 w-3.5" /> Aktivite Zaman Çizelgesi
              </TabsTrigger>
              <TabsTrigger value="tickets" className="text-xs font-medium gap-1.5">
                <TicketIcon className="h-3.5 w-3.5" /> Destek Talepleri
              </TabsTrigger>
              <TabsTrigger value="addresses" className="text-xs font-medium gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Adresler
              </TabsTrigger>
            </TabsList>
            
            {/* Timeline Tab */}
            <TabsContent value="activities" className="mt-4">
              <Card className="border border-slate-200/80 shadow-xs bg-white">
                <CardHeader className="border-b border-slate-100 py-3.5">
                  <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <History className="h-4 w-4 text-slate-500" /> Aktivite Tarihçesi
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {isLoadingActivities ? (
                    <div className="text-center py-4 text-slate-500 text-xs">Aktiviteler yükleniyor...</div>
                  ) : activities?.length === 0 ? (
                    <EmptyState title="Henüz aktivite bulunmuyor" description="Bu müşteri için kaydedilmiş işlem tarihçesi mevcut değil." />
                  ) : (
                    <div className="relative border-l border-slate-200 ml-3 space-y-6">
                      {activities?.map((act) => (
                        <div key={act.id} className="relative pl-6">
                          <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-slate-900 ring-4 ring-white" />
                          <div className="space-y-1">
                            <span className="text-xs font-semibold text-slate-900 block">
                              {getActivityTitle(act.type)}
                            </span>
                            <p className="text-xs text-slate-600">{act.description}</p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                              <Clock className="h-3 w-3" />
                              <span>{format(new Date(act.createdAt), 'dd MMMM yyyy, HH:mm', { locale: tr })}</span>
                              {act.performedBy && (
                                <>
                                  <span>•</span>
                                  <span className="font-medium text-slate-600">{act.performedBy.name}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Tickets Tab */}
            <TabsContent value="tickets" className="mt-4">
              <Card className="border border-slate-200/80 shadow-xs bg-white">
                <CardHeader className="border-b border-slate-100 py-3.5 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-slate-900">Destek Talepleri</CardTitle>
                  {canManage && (
                    <Button size="sm" onClick={() => setIsTicketModalOpen(true)} className="h-7 text-xs bg-slate-900 text-white">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Yeni Talep
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  {isLoadingTickets ? (
                    <div className="text-center py-4 text-slate-500 text-xs">Talepler yükleniyor...</div>
                  ) : tickets?.content.length === 0 ? (
                    <EmptyState
                      title="Destek talebi bulunmuyor"
                      description="Bu müşteriye ait aktif veya geçmiş destek talebi oluşturulmamış."
                      actionLabel={canManage ? "Talep Oluştur" : undefined}
                      onAction={canManage ? () => setIsTicketModalOpen(true) : undefined}
                    />
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {tickets?.content.map((ticket) => (
                        <div 
                           key={ticket.id} 
                           onClick={() => navigate(`/tickets/${ticket.id}`)}
                           className="flex items-center justify-between p-4 hover:bg-slate-50/80 crm-transition cursor-pointer"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-slate-900">{ticket.ticketNumber}</span>
                              <PriorityBadge priority={ticket.priority} />
                            </div>
                            <h4 className="text-xs font-medium text-slate-800">{ticket.subject}</h4>
                            <span className="text-[11px] text-slate-400 block">
                              Oluşturulma: {format(new Date(ticket.createdAt), 'dd MMM yyyy', { locale: tr })}
                            </span>
                          </div>
                          <StatusBadge status={ticket.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Addresses Tab */}
            <TabsContent value="addresses" className="mt-4">
              <Card className="border border-slate-200/80 shadow-xs bg-white">
                <CardHeader className="border-b border-slate-100 py-3.5 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-slate-900">Kayıtlı Adresler</CardTitle>
                  {canManage && (
                    <Button size="sm" onClick={() => setIsAddressModalOpen(true)} className="h-7 text-xs bg-slate-900 text-white">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Yeni Adres
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-4">
                  {isLoadingAddresses ? (
                    <div className="text-center py-4 text-slate-500 text-xs">Adresler yükleniyor...</div>
                  ) : addresses?.length === 0 ? (
                    <EmptyState
                      title="Kayıtlı adres bulunmuyor"
                      description="Müşteri için henüz adres tanımı yapılmamış."
                      actionLabel={canManage ? "Adres Ekle" : undefined}
                      onAction={canManage ? () => setIsAddressModalOpen(true) : undefined}
                    />
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {addresses?.map(address => (
                        <div key={address.id} className="border border-slate-200 rounded-xl p-4 relative group hover:border-slate-300 crm-transition bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 font-semibold text-xs text-slate-900">
                              <Building2 className="h-3.5 w-3.5 text-slate-400" />
                              {address.title}
                            </div>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-slate-100 rounded-md text-slate-600 border border-slate-200">
                              {address.addressType === 'WORK' ? 'İŞ' : 
                               address.addressType === 'HOME' ? 'EV' : 
                               address.addressType === 'BILLING' ? 'FATURA' :
                               address.addressType === 'SHIPPING' ? 'TESLİMAT' : 'DİĞER'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 space-y-1 mt-2">
                            <p className="font-medium text-slate-800">{address.addressLine}</p>
                            <p>{address.district} / {address.city}</p>
                            <p className="text-slate-400">{address.postalCode} - {address.country}</p>
                          </div>
                          
                          {canDelete && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-7 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              onClick={() => setDeleteAddressId(address.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Address Modal */}
      <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Yeni Adres Ekle</DialogTitle>
            <DialogDescription className="text-xs">Müşteriye ait lokasyon veya fatura adresi bilgilerini girin.</DialogDescription>
          </DialogHeader>
          <form onSubmit={addressForm.handleSubmit((values) => createAddressMutation.mutate(values))} className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Başlık (Örn. Merkez Ofis)</Label>
                <Input {...addressForm.register('title')} className="h-8 text-xs" />
                {addressForm.formState.errors.title && <p className="text-[11px] text-rose-500">{addressForm.formState.errors.title.message}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tip</Label>
                <Controller
                  control={addressForm.control}
                  name="addressType"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Tip seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WORK">İş</SelectItem>
                        <SelectItem value="HOME">Ev</SelectItem>
                        <SelectItem value="BILLING">Fatura</SelectItem>
                        <SelectItem value="SHIPPING">Teslimat</SelectItem>
                        <SelectItem value="OTHER">Diğer</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs">Adres Satırı</Label>
              <Input {...addressForm.register('addressLine')} className="h-8 text-xs" />
              {addressForm.formState.errors.addressLine && <p className="text-[11px] text-rose-500">{addressForm.formState.errors.addressLine.message}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">İlçe</Label>
                <Input {...addressForm.register('district')} className="h-8 text-xs" />
                {addressForm.formState.errors.district && <p className="text-[11px] text-rose-500">{addressForm.formState.errors.district.message}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Şehir</Label>
                <Input {...addressForm.register('city')} className="h-8 text-xs" />
                {addressForm.formState.errors.city && <p className="text-[11px] text-rose-500">{addressForm.formState.errors.city.message}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Posta Kodu</Label>
                <Input {...addressForm.register('postalCode')} className="h-8 text-xs" />
                {addressForm.formState.errors.postalCode && <p className="text-[11px] text-rose-500">{addressForm.formState.errors.postalCode.message}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Ülke</Label>
                <Input {...addressForm.register('country')} className="h-8 text-xs" />
                {addressForm.formState.errors.country && <p className="text-[11px] text-rose-500">{addressForm.formState.errors.country.message}</p>}
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddressModalOpen(false)}>İptal</Button>
              <Button type="submit" size="sm" className="bg-slate-900 text-white" disabled={createAddressMutation.isPending}>
                {createAddressMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ticket Modal */}
      <Dialog open={isTicketModalOpen} onOpenChange={setIsTicketModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Yeni Destek Talebi Oluştur</DialogTitle>
            <DialogDescription className="text-xs">
              Bu müşteri için yeni bir bildirim/destek talebi kaydı oluşturun.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={ticketForm.handleSubmit((values) => createTicketMutation.mutate(values))} className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label className="text-xs">Konu</Label>
              <Input {...ticketForm.register('subject')} placeholder="Sorunun kısa tanımı" className="h-8 text-xs" />
              {ticketForm.formState.errors.subject && <p className="text-[11px] text-rose-500">{ticketForm.formState.errors.subject.message}</p>}
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs">Öncelik Seviyesi</Label>
              <Controller
                control={ticketForm.control}
                name="priority"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Öncelik seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Düşük</SelectItem>
                      <SelectItem value="MEDIUM">Normal</SelectItem>
                      <SelectItem value="HIGH">Yüksek</SelectItem>
                      <SelectItem value="CRITICAL">Kritik</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Detaylı Açıklama</Label>
              <textarea 
                className="flex min-h-[90px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-xs shadow-xs placeholder:text-slate-400 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-slate-400" 
                placeholder="Destek konusuna ait detaylar..."
                {...ticketForm.register('description')}
              />
              {ticketForm.formState.errors.description && <p className="text-[11px] text-rose-500">{ticketForm.formState.errors.description.message}</p>}
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsTicketModalOpen(false)}>İptal</Button>
              <Button type="submit" size="sm" className="bg-slate-900 text-white" disabled={createTicketMutation.isPending}>
                {createTicketMutation.isPending ? 'Oluşturuluyor...' : 'Talep Oluştur'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Address Delete */}
      <ConfirmDialog
        open={deleteAddressId !== null}
        onOpenChange={(open) => !open && setDeleteAddressId(null)}
        title="Adresi Sil"
        description="Bu adresi silmek istediğinize emin misiniz? İşlem kalıcı olarak silinecektir."
        confirmText="Adresi Sil"
        onConfirm={() => deleteAddressId && deleteAddressMutation.mutate(deleteAddressId)}
        isLoading={deleteAddressMutation.isPending}
      />
    </div>
  );
}
