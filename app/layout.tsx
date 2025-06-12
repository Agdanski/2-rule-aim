import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SupabaseProvider } from '@/components/providers/supabase-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { SubscriptionProvider } from '@/components/providers/subscription-provider';
import { Analytics } from '@/components/analytics';
import { Toaster } from '@/components/toaster';

// Load Inter font
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'What to Eat? The 2-Rule AIM',
  description: 'Anti-inflammatory meal generator, builder, and planner based on the 2-Rule AIM system',
  keywords: [
    'anti-inflammatory',
    'meal planner',
    'nutrition',
    'diet',
    'health',
    'fructose',
    'omega-3',
    'omega-6',
    'meal generator',
    '2-Rule AIM'
  ],
  authors: [
    {
      name: 'Dr. Allan M. Gdanski',
      url: 'https://gdanskichiropractic.com',
    },
  ],
  creator: 'Dr. Allan M. Gdanski',
  publisher: '2-Rule AIM',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans bg-background text-text-primary min-h-screen`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <SupabaseProvider>
            <SubscriptionProvider>
              <main className="flex flex-col min-h-screen">
                {children}
              </main>
              <Toaster />
              <Analytics />
            </SubscriptionProvider>
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
