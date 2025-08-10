import type { JSX } from "react";

type NotificationProps = {
  message: string;
};

export default function Notification({
  message,
}: NotificationProps): JSX.Element {
  return (
    <div role="status">
      <p>{message}</p>
    </div>
  );
}
