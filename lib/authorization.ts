import type { RoleCode } from "@/lib/auth";

export function isRoleCode(value: string): value is RoleCode {
  return value === "admin" || value === "editor" || value === "viewer";
}

export function canAccessAdmin(role: RoleCode): boolean {
  return role === "admin";
}

export function canUseScoreInput(role: RoleCode): boolean {
  return role === "admin" || role === "editor";
}

export function canEditMatches(role: RoleCode): boolean {
  return role === "admin" || role === "editor";
}

export function canViewPages(role: RoleCode): boolean {
  return role === "admin" || role === "editor" || role === "viewer";
}
