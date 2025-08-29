import "@/pages/Root.css";

import { type JSX, useContext } from "react";
import { Link, Outlet } from "react-router-dom";

import AudioPlayerController from "@/components/AudioPlayerController";
import Notification from "@/components/Notification";
import AudioPlayerProvider from "@/contexts/AudioPlayerProvider";
import { NotificationContext } from "@/contexts/NotificationContext";
import NotificationProvider from "@/contexts/NotificationProvider";

export default function Root(): JSX.Element {
  return (
    <>
      <AudioPlayerProvider>
        <NotificationProvider>
          <LayoutContent />
        </NotificationProvider>
      </AudioPlayerProvider>
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

      <AudioPlayerController />
    </>
  );
}
