import type {Metadata} from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: 'Zenith Meditation',
  description: 'A focused, offline-first meditation timer with free and timed modes, distraction tracking, and local history.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} dark`}>
      <body className="bg-[#0A0502] text-[#E0D8D0] font-serif antialiased selection:bg-[#C95A2B]/30 relative" suppressHydrationWarning>
        <svg 
          className="pointer-events-none fixed inset-0 z-50 h-[100dvh] w-full opacity-[0.04] mix-blend-overlay"
          xmlns="http://www.w3.org/2000/svg"
        >
          <filter id="noiseFilter">
            <feTurbulence 
              type="fractalNoise" 
              baseFrequency="0.75" 
              numOctaves="3" 
              stitchTiles="stitch" 
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
        {children}
      </body>
    </html>
  );
}
