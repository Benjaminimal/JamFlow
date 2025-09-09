import "@/pages/Root.css";

import { type JSX, memo } from "react";
import { Link, Outlet } from "react-router-dom";

import AudioPlayerContainer from "@/components/AudioPlayerContainer";
import NotificationContainer from "@/components/NotificationContainer";
import NotificationProvider from "@/contexts/NotificationProvider";
import PlaybackProvider from "@/contexts/PlaybackProvider";

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

const Navbar = memo((): JSX.Element => {
  return (
    <nav>
      <Link to="/">Home</Link> | <Link to="/upload">Upload</Link> |{" "}
      <Link to="/tracks">Tracks</Link>
    </nav>
  );
});
