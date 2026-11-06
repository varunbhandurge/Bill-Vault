// ==============================================================================
// ASSETCARE - SECURE AUTHENTICATION & JWT UTILITIES
// ==============================================================================

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { dbUsers, dbAuditLogs } from '../db/db';
import { User, UserRole } from '../db/schema';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'assetcare-secure-jwt-token-secret-2026';
const TOKEN_COOKIE_NAME = 'assetcare_session';

export interface TokenPayload {
  userId: string;
  username: string;
  email: string;
  role: UserRole;
  mustChangePassword: boolean;
  householdId?: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export function hashPassword(plainText: string): string {
  return bcrypt.hashSync(plainText, 10);
}

export function comparePassword(plainText: string, hash: string): boolean {
  return bcrypt.compareSync(plainText, hash);
}

export function getSessionUser(request: NextRequest): TokenPayload | null {
  // Check authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return verifyToken(token);
  }

  // Check cookie
  const cookie = request.cookies.get(TOKEN_COOKIE_NAME);
  if (cookie?.value) {
    return verifyToken(cookie.value);
  }

  return null;
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: TOKEN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.delete(TOKEN_COOKIE_NAME);
}
