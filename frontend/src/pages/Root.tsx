import { Link, Outlet } from "@tanstack/react-router";
import { type JSX, type ReactNode } from "react";
import { Toaster } from "sonner";

import { AudioPlayerContainer } from "@/components/playback";
import { H1 } from "@/components/primitives";
import { UploadDialogContainer } from "@/components/upload";
import { PlaybackProvider, usePlaybackContext } from "@/contexts/playback";
import { cn } from "@/lib/utils";

// TODO:
// - make better use of clamp util (e.g. in usePlayback)
// - consider accessibility for timestamps and durations
// - uploading a new track should be visible in the track list without a full reload
// - clean up outdated components
// - port test from old components to new ones
// - look at test failures due to heavy refactoring
export function Root(): JSX.Element {
  return (
    <AppProviders>
      <Layout />
    </AppProviders>
  );
}

function Layout(): JSX.Element {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <Main />
      <Footer />
    </div>
  );
}

function AppProviders({ children }: { children: ReactNode }) {
  return <PlaybackProvider>{children}</PlaybackProvider>;
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
    <main className="flex-1 overflow-y-auto">
      <PageContainer>
        <Toaster position="top-center" theme="system" richColors />
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
        <div className="flex items-center justify-between">
          <Link to="/">
            <H1>JamFlow</H1>
          </Link>
          <UploadDialogContainer />
        </div>
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
