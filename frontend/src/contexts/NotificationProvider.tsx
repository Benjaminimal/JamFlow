import { type JSX, type ReactNode, useState } from "react";

import {
  NotificaitonContext,
  type Notification,
} from "@/contexts/NotifcationContext";

export default function NotificationProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const addNotification = (message: string) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message }]);
  };

  return (
    <NotificaitonContext.Provider value={{ notifications, addNotification }}>
      {children}
    </NotificaitonContext.Provider>
  );
}
