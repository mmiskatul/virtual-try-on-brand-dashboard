import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import {
  BRAND_ACCESS_COOKIE,
  BRAND_REFRESH_COOKIE,
  BRAND_SESSION_COOKIE,
  buildBrandCookieHeader,
  isAllowedBrandRole,
  isValidBrandAccessCookie,
  isValidBrandRefreshCookie,
  verifyBrandSessionWithBackend,
} from './portal-auth';

export interface VerifiedBrandSession {
  userId: string;
  email: string;
  name?: string | null;
  role: string;
  tenantId?: string;
}

/**
 * Verifies NextAuth merchant session + HttpOnly backend access/refresh token cookies
 * in Server Components, Route Handlers, and Server Actions.
 */
export async function getVerifiedBrandSession(): Promise<VerifiedBrandSession | null> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const role = session?.user?.role;

  if (!session?.user || !userId || !isAllowedBrandRole(role)) {
    return null;
  }

  const cookieStore = cookies();
  const accessToken = cookieStore.get(BRAND_ACCESS_COOKIE)?.value;
  const refreshToken = cookieStore.get(BRAND_REFRESH_COOKIE)?.value;
  const sessionCookie = cookieStore.get(BRAND_SESSION_COOKIE)?.value;

  const hasValidAccess = isValidBrandAccessCookie(accessToken, userId, sessionCookie);
  const hasValidRefresh = isValidBrandRefreshCookie(refreshToken, userId, sessionCookie);

  if (!hasValidAccess && !hasValidRefresh) {
    return null;
  }

  const sessionCheckCookie = hasValidAccess
    ? buildBrandCookieHeader({ accessToken, sessionToken: sessionCookie })
    : buildBrandCookieHeader({ accessToken, sessionToken: sessionCookie, refreshToken });

  const verification = await verifyBrandSessionWithBackend(sessionCheckCookie, userId);
  if (!verification.ok) {
    return null;
  }

  const resolvedTenantId = verification.tenantId || session.user.tenantId;

  return {
    userId,
    email: session.user.email || '',
    name: session.user.name,
    role,
    tenantId: resolvedTenantId,
  };
}

export async function requireBrandPageSession(loginRedirect = '/login'): Promise<VerifiedBrandSession> {
  const verified = await getVerifiedBrandSession();
  if (!verified) {
    redirect(loginRedirect);
  }
  return verified;
}

export async function requireBrandServerAction(expectedTenantId?: string): Promise<VerifiedBrandSession> {
  const verified = await getVerifiedBrandSession();
  if (!verified) {
    throw new Error('Unauthorized: valid brand merchant authentication and access token required.');
  }
  if (expectedTenantId && verified.tenantId && verified.tenantId !== expectedTenantId) {
    throw new Error('Forbidden: cross-tenant merchant profile access denied.');
  }
  return verified;
}
