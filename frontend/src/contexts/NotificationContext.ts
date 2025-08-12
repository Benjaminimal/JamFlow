import { createContext } from "react";

import { ApplicationError } from "@/errors";

export type Notification = {
  id: number;
  message: string;
};

export type NotificationContextType = {
  notifications: Notification[];
  addNotification: (v: string) => void;
};

export const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  addNotification: () => {
    throw new ApplicationError(
      "addNotification called outside of NotificationProvider",
    );
  },
});
