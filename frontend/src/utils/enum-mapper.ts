export function mapTicketStatus(status: string) {
  switch (status) {
    case 'OPEN':
      return { label: 'Açık', variant: 'amber', bg: 'bg-amber-50 text-amber-700 border-amber-200/80', dot: 'bg-amber-500' };
    case 'IN_PROGRESS':
      return { label: 'İşlemde', variant: 'sky', bg: 'bg-sky-50 text-sky-700 border-sky-200/80', dot: 'bg-sky-500' };
    case 'RESOLVED':
      return { label: 'Çözüldü', variant: 'emerald', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', dot: 'bg-emerald-500' };
    case 'CLOSED':
      return { label: 'Kapalı', variant: 'slate', bg: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
    default:
      return { label: status, variant: 'slate', bg: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
  }
}

export function mapCustomerStatus(status: string) {
  switch (status) {
    case 'ACTIVE':
      return { label: 'Aktif', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', dot: 'bg-emerald-500' };
    case 'INACTIVE':
      return { label: 'Pasif', bg: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
    case 'BLOCKED':
    case 'SUSPENDED':
      return { label: 'Engelli', bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' };
    default:
      return { label: status, bg: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
  }
}

export function mapTicketPriority(priority: string) {
  switch (priority) {
    case 'LOW':
      return { label: 'Düşük', color: 'text-slate-600', bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    case 'MEDIUM':
    case 'NORMAL':
      return { label: 'Normal', color: 'text-blue-600', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'HIGH':
      return { label: 'Yüksek', color: 'text-amber-600', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'CRITICAL':
      return { label: 'Kritik', color: 'text-rose-600', bg: 'bg-rose-50 text-rose-700 border-rose-200 font-bold' };
    default:
      return { label: priority, color: 'text-slate-600', bg: 'bg-slate-50 text-slate-700 border-slate-200' };
  }
}

export function mapCustomerType(type: string) {
  switch (type) {
    case 'INDIVIDUAL':
      return 'Bireysel';
    case 'CORPORATE':
      return 'Kurumsal';
    default:
      return type;
  }
}

export function mapUserRole(role: string) {
  switch (role) {
    case 'ADMIN':
      return 'Sistem Yöneticisi';
    case 'MANAGER':
      return 'Yönetici Yrd.';
    case 'USER':
    case 'AGENT':
      return 'Temsilci';
    default:
      return role;
  }
}

export function mapActionType(action: string) {
  switch (action) {
    case 'LOGIN':
      return 'GİRİŞ';
    case 'CUSTOMER_CREATE':
      return 'MÜŞTERİ EKLENDİ';
    case 'CUSTOMER_UPDATE':
      return 'MÜŞTERİ GÜNCELLEDİ';
    case 'CUSTOMER_DELETE':
      return 'MÜŞTERİ SİLİNDİ';
    case 'TICKET_CREATE':
      return 'TALEP OLUŞTURULDU';
    case 'TICKET_ASSIGN':
      return 'TALEP ATANDI';
    case 'TICKET_STATUS_CHANGE':
      return 'TALEP DURUM DEĞİŞTİ';
    case 'TICKET_PRIORITY_CHANGE':
      return 'TALEP ÖNCELİK DEĞİŞTİ';
    case 'USER_CREATE':
      return 'KULLANICI OLUŞTURULDU';
    case 'USER_UPDATE':
      return 'KULLANICI GÜNCELLEDİ';
    case 'USER_ROLE_CHANGE':
      return 'KULLANICI ROL DEĞİŞTİ';
    case 'USER_ENABLE':
      return 'KULLANICI AKTİF EDİLDİ';
    case 'USER_DISABLE':
      return 'KULLANICI PASİF EDİLDİ';
    default:
      return action;
  }
}

export function formatUserName(firstName?: string, lastName?: string): string {
  if (!firstName && !lastName) return 'Kullanıcı';
  if (firstName === 'System' && lastName === 'Admin') return 'Sistem Yöneticisi';
  return `${firstName || ''} ${lastName || ''}`.trim();
}
