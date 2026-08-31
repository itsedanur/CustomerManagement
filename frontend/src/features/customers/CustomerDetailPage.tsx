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

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Plus, PlusCircle, Trash2, Ticket as TicketIcon, Building2, Mail, Phone } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { toast } from 'sonner';

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
  const canEditCustomer = user?.role === 'ADMIN' || user?.role === 'MANAGER';

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
    return <div className="p-8 text-center text-slate-500">Müşteri yükleniyor...</div>;
  }

  if (!customer) {
    return <div className="p-8 text-center text-red-500">Müşteri bulunamadı.</div>;
  }

  const getStatusBadgeTr = (status: string) => {
    switch(status) {
      case 'ACTIVE': return 'AKTİF';
      case 'INACTIVE': return 'PASİF';
      default: return status;
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

  const getTicketStatusBadgeTr = (status: string) => {
    switch(status) {
      case 'OPEN': return 'AÇIK';
      case 'IN_PROGRESS': return 'İŞLEMDE';
      case 'RESOLVED': return 'ÇÖZÜLDÜ';
      case 'CLOSED': return 'KAPALI';
      default: return status;
    }
  };

  const getActivityTitle = (type: string) => {
    switch(type) {
      case 'CUSTOMER_CREATED': return 'Müşteri oluşturuldu';
      case 'CUSTOMER_UPDATED': return 'Müşteri güncellendi';
      case 'ADDRESS_ADDED': return 'Adres eklendi';
      case 'ADDRESS_UPDATED': return 'Adres güncellendi';
      case 'ADDRESS_DELETED': return 'Adres silindi';
      case 'TICKET_CREATED': return 'Destek talebi oluşturuldu';
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
      <PageHeader 
        title={`${customer.firstName} ${customer.lastName}`}
        backUrl="/customers"
        breadcrumbs={[
          { label: 'Müşteriler', href: '/customers' },
          { label: `${customer.firstName} ${customer.lastName}` }
        ]}
        actions={
          <>
            {canEditCustomer && (
              <Button onClick={() => navigate(`/customers/${customer.id}/edit`)}>
                Düzenle
              </Button>
            )}
            <Button 
              variant="default"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setIsTicketModalOpen(true)}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Yeni Destek Talebi
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Profile Summary */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Genel Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center pb-4 border-b">
              <div className="h-20 w-20 rounded-full bg-slate-200 flex items-center justify-center text-2xl font-bold text-slate-500 mb-4">
                {customer.firstName[0]}{customer.lastName[0]}
              </div>
              <h3 className="text-lg font-bold text-slate-900">{customer.firstName} {customer.lastName}</h3>
              <p className="text-sm text-slate-500">{customer.company}</p>
              
              <div className="flex gap-2 mt-3">
                <Badge variant="outline" className={
                  customer.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  customer.status === 'INACTIVE' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-red-50 text-red-700 border-red-200'
                }>
                  {getStatusBadgeTr(customer.status)}
                </Badge>
                <Badge variant="outline" className="bg-slate-50 text-slate-700">{customer.customerType}</Badge>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="truncate">{customer.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>{customer.phone}</span>
              </div>
            </div>
            
            <div className="pt-4 mt-4 border-t text-xs text-slate-500 space-y-1">
              <p>Oluşturulma: {format(new Date(customer.createdAt), 'dd MMM yyyy, HH:mm', { locale: tr })}</p>
              <p>Güncellenme: {format(new Date(customer.updatedAt), 'dd MMM yyyy, HH:mm', { locale: tr })}</p>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Tabs */}
        <div className="md:col-span-2">
          <Tabs defaultValue="addresses" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="addresses">Adresler</TabsTrigger>
              <TabsTrigger value="tickets">Destek Talepleri</TabsTrigger>
              <TabsTrigger value="activities">Aktiviteler</TabsTrigger>
            </TabsList>
            
            <TabsContent value="addresses" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle>Adresler</CardTitle>
                    <CardDescription>Bu müşteri için adresleri yönetin</CardDescription>
                  </div>
                  {canManage && (
                    <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
                      <DialogTrigger render={<Button size="sm" />}>
                        <Plus className="h-4 w-4 mr-2" /> Yeni Adres
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Yeni Adres Ekle</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={addressForm.handleSubmit((values) => createAddressMutation.mutate(values))} className="space-y-4 pt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Başlık (Örn. Merkez Ofis)</Label>
                              <Input {...addressForm.register('title')} />
                              {addressForm.formState.errors.title && <p className="text-sm text-red-500">{addressForm.formState.errors.title.message}</p>}
                            </div>
                            <div className="space-y-2">
                              <Label>Tip</Label>
                              <Controller
                                control={addressForm.control}
                                name="addressType"
                                render={({ field }) => (
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger>
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
                          
                          <div className="space-y-2">
                            <Label>Adres Satırı</Label>
                            <Input {...addressForm.register('addressLine')} />
                            {addressForm.formState.errors.addressLine && <p className="text-sm text-red-500">{addressForm.formState.errors.addressLine.message}</p>}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>İlçe</Label>
                              <Input {...addressForm.register('district')} />
                              {addressForm.formState.errors.district && <p className="text-sm text-red-500">{addressForm.formState.errors.district.message}</p>}
                            </div>
                            <div className="space-y-2">
                              <Label>Şehir</Label>
                              <Input {...addressForm.register('city')} />
                              {addressForm.formState.errors.city && <p className="text-sm text-red-500">{addressForm.formState.errors.city.message}</p>}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Posta Kodu</Label>
                              <Input {...addressForm.register('postalCode')} />
                              {addressForm.formState.errors.postalCode && <p className="text-sm text-red-500">{addressForm.formState.errors.postalCode.message}</p>}
                            </div>
                            <div className="space-y-2">
                              <Label>Ülke</Label>
                              <Input {...addressForm.register('country')} />
                              {addressForm.formState.errors.country && <p className="text-sm text-red-500">{addressForm.formState.errors.country.message}</p>}
                            </div>
                          </div>

                          <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsAddressModalOpen(false)}>İptal</Button>
                            <Button type="submit" disabled={createAddressMutation.isPending}>
                              {createAddressMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardHeader>
                <CardContent className="pt-4">
                  {isLoadingAddresses ? (
                    <div className="text-center py-4 text-slate-500">Adresler yükleniyor...</div>
                  ) : addresses?.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 border rounded-lg border-dashed">
                      Henüz adres bulunmuyor.
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {addresses?.map(address => (
                        <div key={address.id} className="border rounded-lg p-4 relative group hover:border-slate-300 transition-colors bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 font-semibold text-slate-900">
                              <Building2 className="h-4 w-4 text-slate-500" />
                              {address.title}
                            </div>
                            <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                              {address.addressType === 'WORK' ? 'İŞ' : 
                               address.addressType === 'HOME' ? 'EV' : 
                               address.addressType === 'BILLING' ? 'FATURA' :
                               address.addressType === 'SHIPPING' ? 'TESLİMAT' : 'DİĞER'}
                            </Badge>
                          </div>
                          <div className="text-sm text-slate-600 space-y-1 mt-3">
                            <p className="font-medium text-slate-800">{address.addressLine}</p>
                            <p>{address.district} / {address.city}</p>
                            <p>{address.postalCode} - {address.country}</p>
                          </div>
                          
                          {canDelete && (
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white">
                              <Dialog open={deleteAddressId === address.id} onOpenChange={(open: boolean) => !open && setDeleteAddressId(null)}>
                                <DialogTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteAddressId(address.id)} />}>
                                  <Trash2 className="h-4 w-4" />
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Adresi silmek istediğinize emin misiniz?</DialogTitle>
                                    <DialogDescription>
                                      Bu işlem geri alınamaz. Adres kalıcı olarak silinecektir.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setDeleteAddressId(null)}>İptal</Button>
                                    <Button variant="destructive" onClick={() => deleteAddressMutation.mutate(address.id)} disabled={deleteAddressMutation.isPending}>
                                      {deleteAddressMutation.isPending ? 'Siliniyor...' : 'Sil'}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="tickets" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle>Destek Talepleri</CardTitle>
                    <CardDescription>Bu müşteriye ait destek talepleri</CardDescription>
                  </div>
                  {canManage && (
                    <Dialog open={isTicketModalOpen} onOpenChange={setIsTicketModalOpen}>
                      <DialogTrigger render={<Button size="sm" />}>
                        <Plus className="h-4 w-4 mr-2" /> Yeni Destek Talebi
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Yeni Destek Talebi Oluştur</DialogTitle>
                          <DialogDescription>
                            Yeni bir talep AÇIK durumunda oluşturulacaktır.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={ticketForm.handleSubmit((values) => createTicketMutation.mutate(values))} className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label>Konu</Label>
                            <Input {...ticketForm.register('subject')} placeholder="Sorunun kısa bir özeti" />
                            {ticketForm.formState.errors.subject && <p className="text-sm text-red-500">{ticketForm.formState.errors.subject.message}</p>}
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Öncelik</Label>
                            <Controller
                              control={ticketForm.control}
                              name="priority"
                              render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Öncelik seçin" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="LOW">Düşük</SelectItem>
                                    <SelectItem value="MEDIUM">Orta</SelectItem>
                                    <SelectItem value="HIGH">Yüksek</SelectItem>
                                    <SelectItem value="CRITICAL">Kritik</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Açıklama</Label>
                            <textarea 
                               className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50" 
                               placeholder="Problemin detaylı açıklaması..."
                               {...ticketForm.register('description')}
                            />
                            {ticketForm.formState.errors.description && <p className="text-sm text-red-500">{ticketForm.formState.errors.description.message}</p>}
                          </div>

                          <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsTicketModalOpen(false)}>İptal</Button>
                            <Button type="submit" disabled={createTicketMutation.isPending}>
                              {createTicketMutation.isPending ? 'Oluşturuluyor...' : 'Talep Oluştur'}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardHeader>
                <CardContent className="pt-4">
                  {isLoadingTickets ? (
                    <div className="text-center py-4 text-slate-500">Talepler yükleniyor...</div>
                  ) : tickets?.content.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 border rounded-lg border-dashed flex flex-col items-center">
                      <TicketIcon className="h-10 w-10 text-slate-300 mb-2" />
                      <p className="font-medium text-slate-900">Destek talebi bulunamadı.</p>
                      <p className="text-sm mt-1">Bu müşteri için bir destek talebi oluşturarak süreci başlatabilirsiniz.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {tickets?.content.map((ticket) => (
                        <div 
                           key={ticket.id} 
                           onClick={() => navigate(`/tickets/${ticket.id}`)}
                           className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer bg-white group"
                        >
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm text-slate-500">{ticket.ticketNumber}</span>
                              <Badge variant="outline" className={
                                 ticket.priority === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' :
                                 ticket.priority === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                 ticket.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                 'bg-blue-50 text-blue-700 border-blue-200'
                              }>
                                {getPriorityBadgeTr(ticket.priority)}
                              </Badge>
                            </div>
                            <span className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{ticket.subject}</span>
                            <span className="text-xs text-slate-500">Oluşturulma: {format(new Date(ticket.createdAt), 'dd MMM yyyy', { locale: tr })}</span>
                          </div>
                          
                          <div className="mt-4 sm:mt-0">
                            <Badge variant="outline" className={
                               ticket.status === 'OPEN' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                               ticket.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                               ticket.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                               'bg-slate-100 text-slate-700 border-slate-200'
                            }>
                              {getTicketStatusBadgeTr(ticket.status)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activities" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Aktiviteler</CardTitle>
                  <CardDescription>Müşteri hesabındaki tüm etkinlikler ve tarihçesi</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingActivities ? (
                    <div className="text-center py-4 text-slate-500">Aktiviteler yükleniyor...</div>
                  ) : activities?.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 border rounded-lg border-dashed">
                      Henüz aktivite bulunmuyor.
                    </div>
                  ) : (
                    <div className="relative border-l border-slate-200 ml-4 space-y-6">
                      {activities?.map((activity) => (
                        <div key={activity.id} className="relative pl-6">
                          <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-white" />
                          <div className="flex flex-col space-y-1">
                            <span className="text-sm font-medium text-slate-900">{getActivityTitle(activity.type)}</span>
                            <span className="text-sm text-slate-600">{activity.description}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-400">
                                {format(new Date(activity.createdAt), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                              </span>
                              {activity.performedBy && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-xs text-slate-500 font-medium">{activity.performedBy.name}</span>
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
          </Tabs>
        </div>
      </div>
    </div>
  );
}
