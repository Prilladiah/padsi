// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

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
        {/* Hapus Sidebar dari sini, header akan ada di masing-masing page */}
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}