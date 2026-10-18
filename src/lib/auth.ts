import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

const providers: NextAuthOptions['providers'] = [
  CredentialsProvider({
    name: 'Brand Merchant Login',
    credentials: {
      email: { label: 'Merchant Email', type: 'email', placeholder: 'elena@auraatelier.com' },
      password: { label: 'Password', type: 'password' }
    },
    async authorize(credentials) {
      if (!credentials?.email) {
        return null;
      }

      // Demo/seeded brand owner authentication
      if (credentials.email === 'elena@auraatelier.com' || credentials.email.includes('aura')) {
        return {
          id: 'usr_elena_01',
          name: 'Elena Rostova',
          email: credentials.email,
          image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
          role: 'BRAND_OWNER',
          tenantId: 'tenant_aura'
        };
      }

      return {
        id: `usr_${Date.now()}`,
        name: credentials.email.split('@')[0],
        email: credentials.email,
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        role: 'BRAND_OWNER',
        tenantId: 'tenant_custom'
      };
    }
  })
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60 // 7 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'BRAND_OWNER';
        token.tenantId = (user as any).tenantId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).tenantId = token.tenantId;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET || 'vton-brand-dashboard-fallback-secret-key-32chars'
};
