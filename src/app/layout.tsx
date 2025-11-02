import { Providers } from './providers';
import '@/styles/globals.css';
import type { ReactNode } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';

export const metadata = {
  title: 'Expense Manager',
  description: 'Modern expense tracking and management',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="dark">
        <Providers>
          {/* Responsive layout: mobile-first with sidebar on desktop */}
          <div className="min-h-screen flex flex-col md:grid md:grid-cols-[260px_1fr]">
            {/* Sidebar - hidden on mobile, visible on md+ */}
            <Sidebar />
            
            {/* Main content area */}
            <div className="flex flex-col flex-1">
              <Header />
              <main className="flex-1 p-4 md:p-6 lg:p-8">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
