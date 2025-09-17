import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import { useNotifications } from "@/contexts/NotificationContext";
import { NotificationProvider } from "@/contexts/NotificationProvider";

describe("NotificationProvider", () => {
  describe("when context used outside of it", () => {
    it("throws an error", () => {
      function TestComponent() {
        const { addNotification } = useNotifications();
        addNotification("Something happened");
        return null;
      }

      expect(() => render(<TestComponent />)).toThrowError(
        /called outside of.*provider/i,
      );
    });
  });

  describe("notification management", () => {
    function NotificationTestComponent() {
      const { notifications, addNotification } = useNotifications();
      const [counter, setCounter] = useState<number>(1);

      const handleAdd = () => {
        addNotification(`Message ${counter}`);
        setCounter((c) => c + 1);
      };

      return (
        <div>
          <button onClick={handleAdd}>Add</button>
          <div data-testid="notifications">
            {notifications.map((n) => (
              <p key={n.id} data-id={n.id}>
                {n.message}
              </p>
            ))}
          </div>
        </div>
      );
    }

    it("starts with no notifications", () => {
      render(
        <NotificationProvider>
          <NotificationTestComponent />
        </NotificationProvider>,
      );

      const notificationContainer = screen.getByTestId("notifications");
      expect(notificationContainer.children).toHaveLength(0);
    });

    it("generates distinct ids", () => {
      render(
        <NotificationProvider>
          <NotificationTestComponent />
        </NotificationProvider>,
      );

      fireEvent.click(screen.getByRole("button"));
      fireEvent.click(screen.getByRole("button"));
      fireEvent.click(screen.getByRole("button"));

      const notificationsContainer = screen.getByTestId("notifications");
      const ids = Array.from(notificationsContainer.children).map((el) =>
        el.getAttribute("data-id"),
      );
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("preserves notification order", () => {
      render(
        <NotificationProvider>
          <NotificationTestComponent />
        </NotificationProvider>,
      );

      fireEvent.click(screen.getByRole("button"));
      fireEvent.click(screen.getByRole("button"));
      fireEvent.click(screen.getByRole("button"));

      const notificationsContainer = screen.getByTestId("notifications");
      const messages = Array.from(notificationsContainer.children).map(
        (el) => el.textContent,
      );
      expect(messages).toEqual(["Message 1", "Message 2", "Message 3"]);
    });
  });
});
