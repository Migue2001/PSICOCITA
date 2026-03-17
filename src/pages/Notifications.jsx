import React from 'react';
import { Card, CardContent } from '../components/Card';
import { Badge } from '../components/Badge';
import { useApp } from '../context/AppContext';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bell, Calendar, XCircle, AlertCircle, Info, Check } from 'lucide-react';

export const Notifications = () => {
  const { notifications } = useApp();

  const getIcon = (type) => {
    switch(type) {
      case 'appointment': return <Calendar size={20} className="text-primary" />;
      case 'cancellation': return <XCircle size={20} className="text-error" />;
      case 'warning': return <AlertCircle size={20} className="text-warning" />;
      default: return <Info size={20} className="text-info" />;
    }
  };

  const getBgClass = (type) => {
    switch(type) {
      case 'appointment': return 'bg-primary-light';
      case 'cancellation': return 'bg-error-light';
      case 'warning': return 'bg-warning-light';
      default: return 'bg-info-light';
    }
  };

  return (
    <div className="notifications-container animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-primary-light bg-opacity-20 rounded-full flex items-center justify-center">
          <Bell size={24} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Notificaciones</h1>
          <p className="text-sm text-muted">Avisos y actualizaciones del sistema</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map(notif => (
                <div key={notif.id} className={`p-5 flex gap-4 transition-colors ${!notif.is_read ? 'bg-primary-light bg-opacity-5' : ''} hover:bg-card-hover`}>
                  <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${getBgClass(notif.type)} bg-opacity-20`}>
                    {getIcon(notif.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h4 className={`font-semibold ${!notif.is_read ? 'text-main' : 'text-muted'}`}>
                        {notif.title}
                      </h4>
                      <span className="text-xs text-muted whitespace-nowrap">
                        {format(parseISO(notif.created_at), "d MMM, HH:mm", { locale: es })}
                      </span>
                    </div>
                    <p className="text-sm text-main mb-2">
                      {notif.message}
                    </p>
                    
                    {!notif.is_read && (
                      <button className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
                        <Check size={12} /> Marcar como leída
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center flex flex-col items-center">
              <Bell size={48} className="text-muted opacity-30 mb-4" />
              <h3 className="text-lg font-medium text-main mb-1">Todo al día</h3>
              <p className="text-muted">No tienes notificaciones pendientes de leer.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
