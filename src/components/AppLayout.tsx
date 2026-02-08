import { Navigation } from "./Navigation";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
