// ==============================================================================
// ASSETCARE - BACKEND ROW LEVEL SECURITY (RLS) & ACCESS CONTROL GUARD
// Enforces strict permissions: Regular users CANNOT edit or delete submitted records.
// Only Administrators can perform updates or deletions on assets, bills, and service history.
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, TokenPayload } from './auth';
import { dbAuditLogs } from '../db/db';

export interface GuardResult {
  allowed: boolean;
  user?: TokenPayload;
  response?: NextResponse;
}

export function requireAuth(req: NextRequest): GuardResult {
  const user = getSessionUser(req);
  if (!user) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: 'Unauthorized. Please sign in to access AssetCare.' },
        { status: 401 }
      ),
    };
  }

  // Force password change check if required
  if (user.mustChangePassword && !req.nextUrl.pathname.includes('/auth/change-password')) {
    return {
      allowed: false,
      user,
      response: NextResponse.json(
        { error: 'Password change required on first login.', mustChangePassword: true },
        { status: 403 }
      ),
    };
  }

  return { allowed: true, user };
}

export function requireAdmin(req: NextRequest): GuardResult {
  const authResult = requireAuth(req);
  if (!authResult.allowed || !authResult.user) {
    return authResult;
  }

  if (authResult.user.role !== 'admin') {
    // Log unauthorized attempt to audit log
    dbAuditLogs.create({
      id: `audit-${Date.now()}`,
      user_id: authResult.user.userId,
      username: authResult.user.username,
      action: 'UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT',
      entity_type: 'security',
      details: { path: req.nextUrl.pathname, method: req.method },
      created_at: new Date().toISOString(),
    });

    return {
      allowed: false,
      user: authResult.user,
      response: NextResponse.json(
        { 
          error: 'Access Denied. Only an Administrator is permitted to perform this operation. Regular users cannot edit or delete previously submitted records.',
          code: 'ADMIN_ONLY_RESTRICTION'
        },
        { status: 403 }
      ),
    };
  }

  return authResult;
}

/**
 * Checks if user owns the resource or is admin.
 */
export function checkResourceOwnership(
  user: TokenPayload,
  resourceUserId: string,
  resourceHouseholdId?: string
): boolean {
  if (user.role === 'admin') return true;
  if (user.userId === resourceUserId) return true;
  if (user.householdId && resourceHouseholdId && user.householdId === resourceHouseholdId) {
    return true;
  }
  return false;
}
