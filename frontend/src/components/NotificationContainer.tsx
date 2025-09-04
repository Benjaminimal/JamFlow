import type { JSX } from "react";

import { useNotificationContext as useNotificationContext } from "@/contexts/NotificationContext";

export default function NotificationContainer(): JSX.Element {
  const { notifications } = useNotificationContext();

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
