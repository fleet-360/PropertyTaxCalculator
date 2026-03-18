import jwt, { JwtPayload } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET!;
const SALT_ROUNDS = 12;

// ── Token payload type ────────────────────────────────────────────────
export interface TokenPayload extends JwtPayload {
  userId?: string;
  email?: string;
  role?: string;
}

// ── signToken ─────────────────────────────────────────────────────────
// Signs a JWT with the given payload. Token expires in 7 days.
export function signToken(payload: Record<string, unknown>): string {
  if (!JWT_SECRET) {
    throw new Error('Please define the JWT_SECRET environment variable inside .env.local');
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });
}

// ── verifyToken ───────────────────────────────────────────────────────
// Verifies a JWT and returns the decoded payload, or null if invalid.
export function verifyToken(token: string): TokenPayload | null {
  if (!JWT_SECRET) {
    throw new Error('Please define the JWT_SECRET environment variable inside .env.local');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

// ── hashPassword ──────────────────────────────────────────────────────
// Hashes a plaintext password using bcrypt.
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

// ── comparePassword ───────────────────────────────────────────────────
// Compares a plaintext password against a bcrypt hash.
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ── getTokenFromRequest ───────────────────────────────────────────────
// Extracts the JWT from the 'admin-token' cookie on a NextRequest.
// Returns the token string or null if not present.
export function getTokenFromRequest(request: NextRequest): string | null {
  const token = request.cookies.get('admin-token')?.value;
  return token ?? null;
}
