import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import NotificationToast from '../components/NotificationToast';

export type NotificationType = 'success' | 'warning' | 'info' | 'order_ready';

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
}

interface NotificationContextType {
  showNotification: (title: string, body: string, type?: NotificationType) => void;
}

export const NotificationContext = createContext<NotificationContextType>({
  showNotification: () => {},
});

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const idCounter = useRef(0);

  const showNotification = useCallback((title: string, body: string, type: NotificationType = 'info') => {
    const id = `notif-${Date.now()}-${++idCounter.current}`;
    setNotifications(prev => [...prev, { id, title, body, type }]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <NotificationToast
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </NotificationContext.Provider>
  );
};
