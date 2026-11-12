import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { getBackendApiBaseUrl, isAllowedBrandRole } from './portal-auth';

const BACKEND_API_URL = getBackendApiBaseUrl();
const useSecureNextAuthCookies = Boolean(process.env.NEXTAUTH_URL?.startsWith('https://'));

function readCookieHeader(req: any): string | undefined {
  const headers = req?.headers;
  if (!headers) return undefined;
  if (typeof headers.get === 'function') {
    return headers.get('cookie') || undefined;
  }
  return typeof headers.cookie === 'string' ? headers.cookie : undefined;
}

const providers: NextAuthOptions['providers'] = [
  CredentialsProvider({
    name: 'Brand Merchant Login',
    credentials: {
      email: { label: 'Merchant Email', type: 'email', placeholder: 'elena@auraatelier.com' },
      password: { label: 'Password', type: 'password' }
    },
    async authorize(credentials, req) {
      const cookieHeader = readCookieHeader(req);
      if (cookieHeader && (cookieHeader.includes('vtry_brand_access=') || cookieHeader.includes('vtry_brand_refresh='))) {
        try {
          const sessionRes = await fetch(`${BACKEND_API_URL}/api/v1/auth/session`, {
            method: 'GET',
            headers: {
              Cookie: cookieHeader,
              'X-Auth-Portal': 'brand',
              'X-Auth-Transport': 'cookie',
            },
            cache: 'no-store',
          });
          const sessionData = await sessionRes.json().catch(() => ({}));
          if (sessionRes.ok && sessionData?.authenticated && sessionData?.user && isAllowedBrandRole(sessionData.user.role)) {
            return {
              id: sessionData.user.id,
              name: sessionData.user.name,
              email: sessionData.user.email,
              role: sessionData.user.role || 'BRAND_OWNER',
              tenantId: sessionData.user.tenantId || sessionData.tenant?.id || 'tenant_aura',
              emailVerified: Boolean(sessionData.user.emailVerified),
            };
          }
        } catch {
          // Fall through cleanly if session check failed
        }
      }

      if (!credentials?.email || !credentials?.password) {
        throw new Error('Email and password are required.');
      }

      let response: Response;
      try {
        response = await fetch(`${BACKEND_API_URL}/api/v1/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Portal': 'brand',
            'X-Auth-Transport': 'cookie',
          },
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

      if (!data?.user || !isAllowedBrandRole(data.user.role)) {
        return null;
      }

      return {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role || 'BRAND_OWNER',
        tenantId: data.user.tenantId || data.tenant?.id || 'tenant_aura',
        emailVerified: Boolean(data.user.emailVerified),
      };
    }
  })
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'select_account',
        },
      },
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
  useSecureCookies: useSecureNextAuthCookies,
  cookies: {
    sessionToken: {
      name: useSecureNextAuthCookies
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecureNextAuthCookies,
      },
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        if (!account.id_token || !user?.email) {
          return '/login?error=GoogleSyncFailed';
        }
        try {
          const syncRes = await fetch(`${BACKEND_API_URL}/api/v1/auth/oauth-google`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Auth-Portal': 'brand',
              'X-Auth-Transport': 'cookie',
            },
            body: JSON.stringify({
              idToken: account.id_token,
              email: user.email,
              name: user.name,
            }),
            cache: 'no-store',
          });
          const syncData = await syncRes.json().catch(() => ({}));
          if (!syncRes.ok || !syncData?.oauthExchangeCode || !syncData?.user?.id) {
            if (syncData?.error === 'PortalMismatch') {
              return '/login?error=PortalMismatch';
            }
            if (syncData?.error === 'TenantSuspended') {
              return '/login?error=TenantSuspended';
            }
            return '/login?error=GoogleSyncFailed';
          }
          if (!isAllowedBrandRole(syncData.user.role)) {
            return '/login?error=PortalMismatch';
          }
          user.id = syncData.user.id;
          user.name = syncData.user.name || user.name;
          user.email = syncData.user.email || user.email;
          user.role = syncData.user.role || 'BRAND_OWNER';
          user.tenantId = syncData.user.tenantId || syncData.tenant?.id;
          user.oauthExchangeCode = syncData.oauthExchangeCode;
          user.emailVerified = true;
          return true;
        } catch {
          return '/login?error=GoogleSyncFailed';
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || 'BRAND_OWNER';
        token.tenantId = user.tenantId;
        token.emailVerified = Boolean(user.emailVerified);
        if (user.oauthExchangeCode) {
          token.oauthExchangeCode = user.oauthExchangeCode;
        }
        if (user.image) {
          token.picture = user.image;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || '';
        session.user.role = (token.role as string) || 'BRAND_OWNER';
        session.user.tenantId = token.tenantId;
        session.user.emailVerified = Boolean(token.emailVerified);
        if (typeof token.picture === 'string' && token.picture) {
          session.user.image = token.picture;
        }
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET
};
