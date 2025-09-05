import type { JSX } from "react";

import { useNotifications as useNotifications } from "@/contexts/NotificationContext";

export default function NotificationContainer(): JSX.Element {
  const { notifications } = useNotifications();

  //
  return (
    <>
      {notifications.map(({ id, message }) => (
        <Notification key={id} message={message} />
      ))}
    </>
  );
}

type NotificationProps = {
  message: string;
};

function Notification({ message }: NotificationProps): JSX.Element {
  return (
    <div role="status">
      <p>{message}</p>
    </div>
  );
}
