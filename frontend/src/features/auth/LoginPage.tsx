import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../../app/store';
import { authApi } from '../../services/auth';

import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Building2, Lock, Mail, AlertTriangle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Geçerli bir e-posta adresi giriniz' }),
  password: z.string().min(1, { message: 'Şifre alanı zorunludur' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      login(data.accessToken, {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        role: data.user.role,
      });
      navigate('/');
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    mutation.mutate(values);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/60 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <div className="h-11 w-11 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-md">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">CRM Yönetim Platformu</h1>
          <p className="text-xs text-slate-500">Müşteri ve Destek İlişkileri Portalı</p>
        </div>

        <Card className="shadow-lg border-slate-200/80 bg-white">
          <CardHeader className="space-y-1 text-center pb-4">
            <CardTitle className="text-lg font-bold tracking-tight text-slate-900">Giriş Yapın</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Hesabınıza erişmek için e-posta ve şifrenizi girin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {mutation.isError && (
                <Alert variant="destructive" className="bg-rose-50 border-rose-200 text-rose-800 py-2.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                  <AlertDescription className="text-xs ml-2 font-medium">
                    {((mutation.error as any)?.response?.data?.message) || 'Giriş bilgileri hatalı. Lütfen tekrar deneyin.'}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-700">E-posta Adresi</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="ornek@sirket.com"
                    {...form.register('email')}
                    className={`pl-9 text-xs h-9 ${form.formState.errors.email ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-[11px] text-rose-600 font-medium">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-700">Şifre</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...form.register('password')}
                    className={`pl-9 text-xs h-9 ${form.formState.errors.password ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                  />
                </div>
                {form.formState.errors.password && (
                  <p className="text-[11px] text-rose-600 font-medium">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full h-9 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-xs transition-all mt-2"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
