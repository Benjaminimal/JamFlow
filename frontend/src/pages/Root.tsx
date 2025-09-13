import { type JSX, type ReactNode } from "react";
import { Link, Outlet } from "react-router-dom";

import NotificationContainer from "@/components/NotificationContainer";
import AudioPlayerContainer from "@/components/playback";
import NotificationProvider from "@/contexts/NotificationProvider";
import { PlaybackProvider, usePlaybackContext } from "@/contexts/playback";
import { cn } from "@/lib/utils";

export default function Root(): JSX.Element {
  return (
    <AppProviders>
      <Layout />
    </AppProviders>
  );
}

function AppProviders({ children }: { children: ReactNode }) {
  return (
    <NotificationProvider>
      <PlaybackProvider>{children}</PlaybackProvider>
    </NotificationProvider>
  );
}

function Layout(): JSX.Element {
  const { derived } = usePlaybackContext();

  const stickyHeader = cn(
    "sticky top-0",
    "border-b-accent-foreground",
    "border-b",
    "bg-background",
    "px-4 sm:px-6 lg:px-8",
    "py-2 sm:py-3 lg:py-4",
  );
  const stickyFooter = cn(
    "sticky bottom-0",
    "border-t-accent-foreground",
    "border-t",
    "bg-background",
    "px-4 sm:px-6 lg:px-8",
    "py-2 sm:py-3 lg:py-4",
  );

  return (
    <div className={cn("mx-auto flex min-h-screen max-w-screen-lg flex-col")}>
      <header className={stickyHeader}>
        <h1>JamFlow</h1>
        <Navbar />
      </header>

      <main
        className={cn("grow overflow-y-auto", "px-4", "sm:px-6", "lg:px-8")}
      >
        <NotificationContainer />
        <Outlet />
      </main>

      {!derived.isIdle && (
        <footer className={stickyFooter}>
          <AudioPlayerContainer />
        </footer>
      )}
    </div>
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
