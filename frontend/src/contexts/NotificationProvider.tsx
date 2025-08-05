import {
  type Notification,
  NotificationContext,
} from "@contexts/NotifcationContext";
import { type JSX, type ReactNode, useState } from "react";

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
    <NotificationContext.Provider value={{ notifications, addNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}
