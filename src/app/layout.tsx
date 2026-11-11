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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXTAUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Brand Portal | V-TRY SaaS Operating System',
    template: '%s | V-TRY Brand Portal',
  },
  description:
    'Multi-tenant Brand Administration Platform for apparel catalogs, dual storefront & marketplace publishing, inventory, orders, and dedicated AI Virtual Try-On.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
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
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {nonce && <meta name="csp-nonce" content={nonce} />}
      </head>
      <body
        className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased"
        data-csp-protected={nonce ? 'true' : undefined}
      >
        <QueryProvider>
          <WebVitalReporter serviceName="vton-brand-portal" />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
