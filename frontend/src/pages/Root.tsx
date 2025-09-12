import { type JSX } from "react";
import { Link, Outlet } from "react-router-dom";

import NotificationContainer from "@/components/NotificationContainer";
import AudioPlayerContainer from "@/components/playback";
import NotificationProvider from "@/contexts/NotificationProvider";
import { PlaybackProvider } from "@/contexts/playback";

export default function Root(): JSX.Element {
  return (
    <NotificationProvider>
      <PlaybackProvider>
        <LayoutContent />
      </PlaybackProvider>
    </NotificationProvider>
  );
}

function LayoutContent(): JSX.Element {
  return (
    <>
      <Navbar />
      <h1>JamFlow</h1>

      <NotificationContainer />

      <div id="outlet">
        <Outlet />
      </div>
      <AudioPlayerContainer />
    </>
  );
}

function Navbar(): JSX.Element {
  return (
    <nav>
      <Link to="/">Home</Link> | <Link to="/upload">Upload</Link> |{" "}
      <Link to="/tracks">Tracks</Link>
    </nav>
  );
}
