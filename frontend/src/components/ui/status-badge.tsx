import React from 'react';

export type StatusType = 
  | 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'SUSPENDED' 
  | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusConfig = (st: string) => {
    switch (st) {
      // Customer Statuses
      case 'ACTIVE':
        return { label: 'Aktif', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', dot: 'bg-emerald-500' };
      case 'INACTIVE':
        return { label: 'Pasif', bg: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
      case 'BLOCKED':
      case 'SUSPENDED':
        return { label: 'Engelli', bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' };
      
      // Ticket Statuses
      case 'OPEN':
        return { label: 'Açık', bg: 'bg-amber-50 text-amber-700 border-amber-200/80', dot: 'bg-amber-500' };
      case 'IN_PROGRESS':
        return { label: 'İşlemde', bg: 'bg-sky-50 text-sky-700 border-sky-200/80', dot: 'bg-sky-500' };
      case 'RESOLVED':
        return { label: 'Çözüldü', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', dot: 'bg-emerald-500' };
      case 'CLOSED':
        return { label: 'Kapalı', bg: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
      
      default:
        return { label: st, bg: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};
