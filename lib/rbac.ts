import { NextRequest, NextResponse } from 'next/server'

export type Role = 'OWNER' | 'MANAGER' | 'STAFF'

export const ROLE_HIERARCHY: Record<Role, number> = {
  OWNER: 3,
  MANAGER: 2,
  STAFF: 1,
}

export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

type RouteHandler = (req: NextRequest, ctx: { params: Record<string, string> }) => Promise<NextResponse>

export function withRole(requiredRole: Role, handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    const roleHeader = req.headers.get('x-user-role') as Role | null
    if (!roleHeader || !hasRole(roleHeader, requiredRole)) {
      return NextResponse.json(
        { error: `Requires ${requiredRole} role or higher` },
        { status: 403 },
      )
    }
    return handler(req, ctx)
  }
}
