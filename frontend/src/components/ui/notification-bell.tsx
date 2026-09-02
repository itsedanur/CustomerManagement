import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../../services/notification';
import { Bell, Check, CheckCircle2 } from 'lucide-react';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useNavigate } from 'react-router';
import { Badge } from './badge';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationApi.getUnreadCount,
    refetchInterval: 30000, // fetch every 30 seconds
  });

  const { data: unreadNotifications = [] } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: notificationApi.getUnread,
    enabled: open,
  });

  const markAsReadMutation = useMutation({
    mutationFn: notificationApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotificationClick = (id: number, targetUrl: string) => {
    markAsReadMutation.mutate(id);
    setOpen(false);
    if (targetUrl) {
      navigate(targetUrl);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger>
        <Button variant="ghost" size="icon" className="relative" aria-label="Bildirimler">
          <Bell className="h-5 w-5 text-slate-600" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-slate-900">Bildirimler</h3>
          {unreadNotifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto p-0 text-xs text-blue-600 hover:text-blue-700"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <Check className="h-3 w-3 mr-1" /> Tümünü okundu işaretle
            </Button>
          )}
        </div>
        
        <div className="max-h-[300px] overflow-y-auto">
          {unreadNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-500">
              <CheckCircle2 className="h-8 w-8 mb-2 text-slate-300" />
              <p className="text-sm">Yeni bildiriminiz yok</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {unreadNotifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b last:border-0"
                  onClick={() => handleNotificationClick(notification.id, notification.targetUrl)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm text-slate-900">{notification.title}</span>
                    <span className="text-xs text-slate-500 shrink-0 ml-2">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: tr })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {notification.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
