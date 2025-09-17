import { type JSX, type ReactNode } from "react";
import { Link, Outlet } from "react-router-dom";

import { NotificationContainer } from "@/components/NotificationContainer";
import AudioPlayerContainer from "@/components/playback";
import { H1 } from "@/components/primitives";
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

function Layout(): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <Main />
      <Footer />
    </div>
  );
}

function AppProviders({ children }: { children: ReactNode }) {
  return (
    <NotificationProvider>
      <PlaybackProvider>{children}</PlaybackProvider>
    </NotificationProvider>
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

function PageContainer({ children }: { children: ReactNode }): JSX.Element {
  return (
    <div className={cn("max-w-4xl", "mx-auto", "px-4 sm:px-6 lg:px-8")}>
      {children}
    </div>
  );
}

function Main(): JSX.Element {
  return (
    <main className="grow overflow-y-auto">
      <PageContainer>
        <NotificationContainer />
        <Outlet />
      </PageContainer>
    </main>
  );
}

function Header(): JSX.Element {
  return (
    <header
      className={cn(
        "sticky top-0",
        "border-b-accent-foreground",
        "border-b",
        "bg-background",
        "py-2 sm:py-3 lg:py-4",
      )}
    >
      <PageContainer>
        <H1>JamFlow</H1>
        <Navbar />
      </PageContainer>
    </header>
  );
}

function Footer(): JSX.Element | null {
  const { derived } = usePlaybackContext();

  if (derived.isIdle) return null;
  return (
    <footer
      className={cn(
        "sticky bottom-0",
        "border-t-accent-foreground",
        "border-t",
        "bg-background",
        "py-2 sm:py-3 lg:py-4",
      )}
    >
      <PageContainer>
        <AudioPlayerContainer />
      </PageContainer>
    </footer>
  );
}
