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
import { PageHeader } from '../../components/ui/page-header';

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
      }
      navigate('/customers');
    },
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
    return <div className="p-8 text-center text-slate-500">Müşteri yükleniyor...</div>;
  }

  const backUrl = isEdit ? `/customers/${id}` : '/customers';
  const breadcrumbs = [
    { label: 'Müşteriler', href: '/customers' },
    isEdit 
      ? { label: customer?.firstName ? `${customer.firstName} ${customer.lastName}` : 'Yükleniyor...', href: `/customers/${id}` }
      : null,
    { label: isEdit ? 'Düzenle' : 'Yeni Müşteri' }
  ].filter(Boolean) as any;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader 
        title={isEdit ? 'Müşteriyi Düzenle' : 'Yeni Müşteri'}
        backUrl={backUrl}
        breadcrumbs={breadcrumbs}
        actions={
          <Button variant="outline" onClick={() => navigate(backUrl)}>
            Vazgeç
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Müşteri Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {mutation.isError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {(mutation.error as any)?.response?.data?.message || 'An error occurred while saving the customer.'}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Ad</Label>
                <Input id="firstName" {...form.register('firstName')} />
                {form.formState.errors.firstName && (
                  <p className="text-sm text-red-500">{form.formState.errors.firstName.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Soyad</Label>
                <Input id="lastName" {...form.register('lastName')} />
                {form.formState.errors.lastName && (
                  <p className="text-sm text-red-500">{form.formState.errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input id="email" type="email" {...form.register('email')} />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" {...form.register('phone')} />
                {form.formState.errors.phone && (
                  <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Şirket</Label>
              <Input id="company" {...form.register('company')} />
              {form.formState.errors.company && (
                <p className="text-sm text-red-500">{form.formState.errors.company.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Müşteri Tipi</Label>
                <Controller
                  control={form.control}
                  name="customerType"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INDIVIDUAL">Bireysel</SelectItem>
                        <SelectItem value="CORPORATE">Kurumsal</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.customerType && (
                  <p className="text-sm text-red-500">{form.formState.errors.customerType.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Durum</Label>
                <Controller
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Aktif</SelectItem>
                        <SelectItem value="INACTIVE">İnaktif</SelectItem>
                        <SelectItem value="BLOCKED">Bloklu</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.status && (
                  <p className="text-sm text-red-500">{form.formState.errors.status.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Kaydediliyor...' : 'Müşteriyi Kaydet'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
