import "@/pages/Root.css";

import { type JSX, useContext } from "react";
import { Link, Outlet } from "react-router-dom";

import Notification from "@/components/Notification";
import { NotificationContext } from "@/contexts/NotificationContext";
import NotificationProvider from "@/contexts/NotificationProvider";

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
        <Link to="/">Home</Link> | <Link to="/upload">Upload</Link> |{" "}
        <Link to="/tracks">Tracks</Link>
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
