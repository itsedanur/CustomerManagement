import React from 'react';
import { AlertCircle, AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react';

export type PriorityType = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface PriorityBadgeProps {
  priority: PriorityType | string;
  className?: string;
  showIcon?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className = '', showIcon = true }) => {
  const getPriorityConfig = (pr: string) => {
    switch (pr) {
      case 'LOW':
        return { label: 'Düşük', bg: 'bg-slate-100 text-slate-600 border-slate-200', icon: ArrowDown };
      case 'MEDIUM':
        return { label: 'Normal', bg: 'bg-blue-50 text-blue-700 border-blue-200/80', icon: ArrowUp };
      case 'HIGH':
        return { label: 'Yüksek', bg: 'bg-amber-50 text-amber-700 border-amber-200/80', icon: AlertTriangle };
      case 'CRITICAL':
        return { label: 'Kritik', bg: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold', icon: AlertCircle };
      default:
        return { label: pr, bg: 'bg-slate-100 text-slate-700 border-slate-200', icon: ArrowUp };
    }
  };

  const config = getPriorityConfig(priority);
  const IconComponent = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border ${config.bg} ${className}`}>
      {showIcon && <IconComponent className="h-3 w-3 shrink-0" />}
      {config.label}
    </span>
  );
};
