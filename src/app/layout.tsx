import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Basic CSS is in here now
import { ProgrammesProvider } from '@/context/ProgrammesContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Budget Request Ranking',
  description: 'Rank budget requests through pairwise comparisons',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* className might be used by Inter font, that's fine */}
      <body className={inter.className}>
        <ProgrammesProvider>{children}</ProgrammesProvider>
      </body>
    </html>
  );
} 