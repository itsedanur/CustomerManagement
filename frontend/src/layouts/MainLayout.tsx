import { Outlet, Link, useLocation } from 'react-router';
import { useAuthStore } from '../app/store';
import { 
  LayoutDashboard, 
  Users, 
  Ticket, 
  LogOut,
  Menu,
  ShieldAlert,
  UserCog,
  Building2,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '../components/ui/sheet';
import { NotificationBell } from '../components/ui/notification-bell';
import { UserAvatar } from '../components/ui/user-avatar';

export default function MainLayout() {
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Yönetici';
      case 'MANAGER':
        return 'Yönetici Yrd.';
      case 'USER':
        return 'Temsilci';
      default:
        return role || '';
    }
  };

  const navGroups = [
    {
      title: 'Genel Bakış',
      items: [
        { name: 'Genel Bakış', path: '/', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Müşteri Yönetimi',
      items: [
        { name: 'Müşteriler', path: '/customers', icon: Users },
        { name: 'Destek Talepleri', path: '/tickets', icon: Ticket },
      ],
    },
    ...(user?.role === 'ADMIN' ? [
      {
        title: 'Yönetim',
        items: [
          { name: 'Kullanıcı Yönetimi', path: '/admin/users', icon: UserCog },
          { name: 'Denetim Kayıtları', path: '/admin/audit-logs', icon: ShieldAlert },
        ],
      }
    ] : []),
  ];

  const renderNavLinks = () => (
    <div className="space-y-6">
      {navGroups.map((group, groupIdx) => (
        <div key={groupIdx} className="space-y-1.5">
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {group.title}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const isActive = item.path === '/' 
                ? location.pathname === '/' 
                : location.pathname.startsWith(item.path);
                
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium crm-transition ${
                    isActive 
                      ? 'bg-slate-900 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'}`} />
                    <span>{item.name}</span>
                  </div>
                  {isActive && <ChevronRight className="h-3.5 w-3.5 text-slate-400 opacity-80" />}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50/50">
      {/* Topbar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger>
              <Button size="icon" variant="ghost" className="sm:hidden text-slate-600">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menüyü Aç/Kapat</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4 pt-6">
              <SheetTitle className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-6 px-3">
                <div className="h-7 w-7 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                  <Building2 className="h-4 w-4" />
                </div>
                CRM Sistem
              </SheetTitle>
              {renderNavLinks()}
            </SheetContent>
          </Sheet>
          
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="font-semibold text-slate-900 text-sm hidden sm:inline-block">CRM Platformu</span>
          </div>
        </div>

        {/* User area & notifications */}
        <div className="flex items-center gap-3">
          <NotificationBell />
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2.5 pl-1">
            <UserAvatar name={`${user?.firstName || ''} ${user?.lastName || ''}`} size="sm" />
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 leading-none">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                {getRoleLabel(user?.role)}
              </span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={logout} 
            title="Çıkış Yap"
            className="text-slate-500 hover:text-rose-600 hover:bg-rose-50 h-8 w-8 ml-1"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Body Shell */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden sm:flex sm:flex-col sm:w-60 border-r border-slate-200/80 bg-white p-4">
          <div className="flex-1">
            {renderNavLinks()}
          </div>
          
          {/* Secondary Footer info */}
          <div className="pt-4 border-t border-slate-100 px-3">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Sürüm 1.0.0</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Sistem Aktif" />
            </div>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
