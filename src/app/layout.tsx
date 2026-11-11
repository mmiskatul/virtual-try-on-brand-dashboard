import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import '../lib/server-security';
import { QueryProvider } from '../providers/QueryProvider';
import { WebVitalReporter } from '../components/telemetry/WebVitalReporter';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://brands.v-try.fashion';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Brand Portal | AI Virtual Try-On SaaS',
    template: '%s | V-TRY Brand Portal',
  },
  description: 'Merchant dashboard for clothing brands, apparel inventory, and AI Virtual Try-On neural pipelines.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'V-TRY Merchant Brand Portal',
    title: 'Brand Portal | AI Virtual Try-On SaaS',
    description: 'Empower your fashion label with AI neural draping, 3D fabric simulations, and instant virtual fitting rooms.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
        width: 1200,
        height: 630,
        alt: 'V-TRY Brand Studio Portal',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = headers().get('x-nonce') ?? undefined;

  return (
    <html
      lang="en"
      className={`dark ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {/* Dynamic Cryptographic Nonce for Strict CSP Verification */}
        {nonce && <meta name="csp-nonce" content={nonce} />}
      </head>
      <body
        className="min-h-screen bg-white text-gray-900 font-sans antialiased"
        data-csp-protected={nonce ? 'true' : undefined}
      >
        <QueryProvider>
          {/* Live Real User Monitoring (RUM) for Core Web Vitals */}
          <WebVitalReporter serviceName="vton-brand-portal" />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
