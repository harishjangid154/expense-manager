import { Providers } from './providers';
import '@/styles/globals.css';
import type { ReactNode } from 'react';

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="dark">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
