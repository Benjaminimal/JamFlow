import type { JSX } from "react";

type NotificationProps = {
  message: string;
};

export default function Notification({
  message,
}: NotificationProps): JSX.Element {
  return (
    <div>
      <p>{message}</p>
    </div>
  );
}
