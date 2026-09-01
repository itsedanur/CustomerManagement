import React from 'react';

interface UserAvatarProps {
  name: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ name, className = '', size = 'md' }) => {
  const getInitials = (str: string) => {
    if (!str) return '??';
    const parts = str.trim().split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const sizeClasses = {
    sm: 'h-6 w-6 text-[10px]',
    md: 'h-8 w-8 text-xs',
    lg: 'h-10 w-10 text-sm font-semibold',
  };

  return (
    <div className={`rounded-full bg-slate-900 text-slate-100 flex items-center justify-center shrink-0 border border-slate-700 shadow-xs select-none ${sizeClasses[size]} ${className}`}>
      {getInitials(name)}
    </div>
  );
};
