import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useBlocker } from 'react-router';
import { customerApi } from '../../services/customer';

import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Controller } from 'react-hook-form';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const customerSchema = z.object({
  firstName: z.string().min(1, 'Ad alanı zorunludur'),
  lastName: z.string().min(1, 'Soyad alanı zorunludur'),
  email: z.string().email('Geçersiz e-posta adresi'),
  phone: z.string().min(1, 'Telefon alanı zorunludur'),
  company: z.string().min(1, 'Şirket alanı zorunludur'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']),
  customerType: z.enum(['INDIVIDUAL', 'CORPORATE']),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export default function CustomerFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      status: 'ACTIVE',
      customerType: 'INDIVIDUAL',
    },
  });

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerApi.getById(Number(id)),
    enabled: isEdit,
  });

  useEffect(() => {
    if (customer && isEdit) {
      form.reset({
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        company: customer.company,
        status: customer.status,
        customerType: customer.customerType,
      });
    }
  }, [customer, isEdit, form]);

  const mutation = useMutation({
    mutationFn: (values: CustomerFormValues) => 
      isEdit ? customerApi.update(Number(id), values) : customerApi.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: ['customer', id] });
        toast.success('Müşteri bilgileri başarıyla güncellendi.');
      } else {
        toast.success('Müşteri başarıyla oluşturuldu.');
      }
      navigate('/customers');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Müşteri kaydedilirken bir hata oluştu.');
    }
  });

  const onSubmit = (values: CustomerFormValues) => {
    mutation.mutate(values);
  };

  const { isDirty } = form.formState;
  
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty &&
      currentLocation.pathname !== nextLocation.pathname &&
      !mutation.isSuccess
  );

  useEffect(() => {
    if (blocker.state === 'blocked') {
      const confirmLeave = window.confirm('Kaydedilmemiş değişiklikleriniz var. Sayfadan ayrılmak istediğinize emin misiniz?');
      if (confirmLeave) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);

  if (isEdit && isLoading) {
    return <div className="p-8 text-center text-slate-500 text-xs">Müşteri bilgileri yükleniyor...</div>;
  }

  const backUrl = isEdit ? `/customers/${id}` : '/customers';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Navigation & Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(backUrl)}
            className="h-8 text-xs gap-1 text-slate-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Geri
          </Button>
          <div>
            <h1 className="crm-page-title">{isEdit ? 'Müşteriyi Düzenle' : 'Yeni Müşteri Oluştur'}</h1>
            <p className="crm-secondary-text mt-0.5">Müşteriye ait iletişim ve profil detayları</p>
          </div>
        </div>
      </div>

      <Card className="border border-slate-200/80 shadow-xs bg-white">
        <CardHeader className="border-b border-slate-100 py-3.5">
          <CardTitle className="text-sm font-semibold text-slate-900">Müşteri Formu</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {mutation.isError && (
              <Alert variant="destructive" className="bg-rose-50 border-rose-200 text-rose-800 text-xs py-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <AlertDescription className="ml-2 font-medium">
                  {(mutation.error as any)?.response?.data?.message || 'Müşteri kaydedilirken bir hata oluştu.'}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="firstName" className="text-xs font-semibold text-slate-700">
                  Ad <span className="text-rose-500">*</span>
                </Label>
                <Input id="firstName" placeholder="Ahmet" {...form.register('firstName')} className="h-9 text-xs" />
                {form.formState.errors.firstName && (
                  <p className="text-[11px] text-rose-600 font-medium">{form.formState.errors.firstName.message}</p>
                )}
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="lastName" className="text-xs font-semibold text-slate-700">
                  Soyad <span className="text-rose-500">*</span>
                </Label>
                <Input id="lastName" placeholder="Yılmaz" {...form.register('lastName')} className="h-9 text-xs" />
                {form.formState.errors.lastName && (
                  <p className="text-[11px] text-rose-600 font-medium">{form.formState.errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                  E-posta <span className="text-rose-500">*</span>
                </Label>
                <Input id="email" type="email" placeholder="ahmet@sirket.com" {...form.register('email')} className="h-9 text-xs" />
                {form.formState.errors.email && (
                  <p className="text-[11px] text-rose-600 font-medium">{form.formState.errors.email.message}</p>
                )}
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="phone" className="text-xs font-semibold text-slate-700">
                  Telefon <span className="text-rose-500">*</span>
                </Label>
                <Input id="phone" placeholder="+90 532 000 0000" {...form.register('phone')} className="h-9 text-xs" />
                {form.formState.errors.phone && (
                  <p className="text-[11px] text-rose-600 font-medium">{form.formState.errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="company" className="text-xs font-semibold text-slate-700">
                Şirket Adı <span className="text-rose-500">*</span>
              </Label>
              <Input id="company" placeholder="Teknoloji A.Ş." {...form.register('company')} className="h-9 text-xs" />
              {form.formState.errors.company && (
                <p className="text-[11px] text-rose-600 font-medium">{form.formState.errors.company.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Müşteri Tipi</Label>
                <Controller
                  control={form.control}
                  name="customerType"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INDIVIDUAL">Bireysel</SelectItem>
                        <SelectItem value="CORPORATE">Kurumsal</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Hesap Durumu</Label>
                <Controller
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Aktif</SelectItem>
                        <SelectItem value="INACTIVE">Pasif</SelectItem>
                        <SelectItem value="BLOCKED">Engelli</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end items-center gap-2 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => navigate(backUrl)} className="h-9 text-xs">
                Vazgeç
              </Button>
              <Button type="submit" size="sm" disabled={mutation.isPending} className="bg-slate-900 hover:bg-slate-800 text-white h-9 text-xs gap-1.5 shadow-xs">
                <Save className="h-3.5 w-3.5" />
                {mutation.isPending ? 'Kaydediliyor...' : isEdit ? 'Değişiklikleri Kaydet' : 'Müşteriyi Oluştur'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
