import "@pages/Root.css";

import Notification from "@components/Notification";
import { NotificationContext } from "@contexts/NotifcationContext";
import NotificationProvider from "@contexts/NotificationProvider";
import { type JSX, useContext } from "react";
import { Link, Outlet } from "react-router-dom";

export default function Root(): JSX.Element {
  return (
    <>
      <NotificationProvider>
        <LayoutContent />
      </NotificationProvider>
    </>
  );
}

function LayoutContent(): JSX.Element {
  const { notifications } = useContext(NotificationContext);

  return (
    <>
      <nav>
        <Link to="/">Home</Link> | <Link to="/upload">Upload</Link>
      </nav>

      <h1>JamFlow</h1>

      {notifications.map(({ id, message }) => (
        <Notification key={id} message={message} />
      ))}

      <div id="outlet">
        <Outlet />
      </div>
    </>
  );
}
