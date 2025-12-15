import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import SidebarClient from '@/components/layout/sidebarclient';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SIPS - Sanguku',
  description: 'Sistem Informasi Pengelolaan Stok',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <div className="flex min-h-screen">
          <SidebarClient />
          <main className="flex-1 bg-gray-50">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
