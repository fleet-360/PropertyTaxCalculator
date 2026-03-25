import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken, type TokenPayload } from '@/lib/auth';

/**
 * Ensures the request has a valid admin JWT cookie.
 * Redirects to login when missing or invalid.
 */
export async function requireAdminSession(): Promise<TokenPayload> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin-token')?.value;
  if (!token) {
    redirect('/admin/login');
  }
  const payload = verifyToken(token);
  if (!payload) {
    redirect('/admin/login');
  }
  return payload;
}
