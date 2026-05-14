import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SmartAnatomy - Interactive 3D Anatomy Learning',
  description: 'Learn human anatomy with interactive 3D models and guided practicum',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
