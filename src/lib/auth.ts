import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:4000';

const providers: NextAuthOptions['providers'] = [
  CredentialsProvider({
    name: 'Brand Merchant Login',
    credentials: {
      email: { label: 'Merchant Email', type: 'email', placeholder: 'elena@auraatelier.com' },
      password: { label: 'Password', type: 'password' }
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error('Email and password are required.');
      }

      let response: Response;
      try {
        response = await fetch(`${BACKEND_API_URL}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password
          })
        });
      } catch {
        throw new Error('SERVICE_UNAVAILABLE');
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data?.code === 'EMAIL_NOT_VERIFIED') {
          throw new Error('EMAIL_NOT_VERIFIED');
        }
        if (data?.error === 'TenantSuspended') {
          throw new Error('TENANT_SUSPENDED');
        }
        throw new Error(data?.message || 'Invalid email or password.');
      }

      if (!data?.user) {
        return null;
      }

      return {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        role: data.user.role || 'BRAND_OWNER',
        tenantId: data.user.tenantId || data.tenant?.id || 'tenant_aura',
        emailVerified: Boolean(data.user.emailVerified),
        backendToken: data.token
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
  pages: {
    signIn: '/login',
    error: '/login'
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60 // 7 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || 'BRAND_OWNER';
        token.tenantId = user.tenantId;
        token.backendToken = user.backendToken;
        token.emailVerified = Boolean(user.emailVerified);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || '';
        session.user.role = (token.role as string) || 'BRAND_OWNER';
        session.user.tenantId = token.tenantId;
        session.user.emailVerified = Boolean(token.emailVerified);
      }
      session.backendToken = token.backendToken;
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET
};
