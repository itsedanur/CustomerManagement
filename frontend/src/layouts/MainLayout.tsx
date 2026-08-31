import { Outlet, Link, useLocation } from 'react-router';
import { useAuthStore } from '../app/store';
import { 
  LayoutDashboard, 
  Users, 
  Ticket, 
  LogOut,
  User as UserIcon,
  Menu,
  ShieldAlert,
  UserCog
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '../components/ui/sheet';
import { NotificationBell } from '../components/ui/notification-bell';

export default function MainLayout() {
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Genel Bakış', path: '/', icon: LayoutDashboard },
    { name: 'Müşteriler', path: '/customers', icon: Users },
    { name: 'Destek Talepleri', path: '/tickets', icon: Ticket },
    ...(user?.role === 'ADMIN' ? [
      { name: 'Kullanıcı Yönetimi', path: '/admin/users', icon: UserCog },
      { name: 'Denetim Kayıtları', path: '/admin/audit-logs', icon: ShieldAlert }
    ] : []),
  ];

  const NavLinks = () => (
    <>
      {navItems.map((item) => {
        const isActive = item.path === '/' 
          ? location.pathname === '/' 
          : location.pathname.startsWith(item.path);
          
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
              isActive 
                ? 'bg-slate-100 text-slate-900 font-medium' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-white px-4 sm:static sm:h-16 sm:px-6">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger>
            <Button size="icon" variant="outline" className="sm:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menüyü Aç/Kapat</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="sm:max-w-xs">
            <SheetTitle className="sr-only">Gezinme Menüsü</SheetTitle>
            <nav className="grid gap-2 text-lg font-medium mt-6">
              <NavLinks />
            </nav>
          </SheetContent>
        </Sheet>
        
        <div className="flex w-full justify-between items-center">
          <div className="flex items-center gap-2 font-semibold">
            <div className="h-6 w-6 rounded-md bg-slate-900 flex items-center justify-center">
              <span className="text-white text-xs">CRM</span>
            </div>
            <span className="hidden sm:inline-block">Müşteri Yönetimi</span>
          </div>
          
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <UserIcon className="h-4 w-4" />
              <span className="hidden md:inline">{user?.firstName} {user?.lastName}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium border">
                {user?.role}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} title="Çıkış Yap">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden border-r bg-white sm:flex sm:flex-col sm:w-64">
          <nav className="grid gap-2 p-4 text-sm font-medium">
            <NavLinks />
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
