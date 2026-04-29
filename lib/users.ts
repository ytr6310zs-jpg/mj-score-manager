import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { isRoleCode } from "@/lib/authorization";
import type { RoleCode } from "@/lib/auth";

export type UserRecord = {
  id: number;
  userId: string;
  passwordHash: string;
  displayName: string;
  role: RoleCode;
  roleName: string;
  isActive: boolean;
};

export function getSupabaseServiceClient(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
}

export async function fetchUserByUserId(userId: string): Promise<UserRecord | null> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id,user_id,password_hash,display_name,is_active,roles(code,name)")
    .eq("user_id", userId)
    .limit(1);

  if (error || !data || data.length === 0) {
    if (error) {
      console.error("fetchUserByUserId error:", error);
    }
    return null;
  }

  const row = data[0] as {
    id: number;
    user_id: string;
    password_hash: string;
    display_name: string;
    is_active: boolean;
    roles?: { code?: string; name?: string } | null;
  };

  const roleCodeRaw = String(row.roles?.code ?? "");
  if (!isRoleCode(roleCodeRaw)) {
    return null;
  }

  return {
    id: Number(row.id),
    userId: String(row.user_id),
    passwordHash: String(row.password_hash),
    displayName: String(row.display_name),
    role: roleCodeRaw,
    roleName: String(row.roles?.name ?? roleCodeRaw),
    isActive: Boolean(row.is_active),
  };
}

export type AdminUserRow = {
  id: number;
  userId: string;
  displayName: string;
  role: RoleCode;
  roleName: string;
  isActive: boolean;
  createdAt: string | null;
};

export async function fetchAdminUsers(): Promise<AdminUserRow[]> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("users")
    .select("id,user_id,display_name,is_active,created_at,roles(code,name)")
    .order("id", { ascending: true });

  if (error || !data) {
    if (error) {
      console.error("fetchAdminUsers error:", error);
    }
    return [];
  }

  return data
    .map((row) => {
      const record = row as {
        id: number;
        user_id: string;
        display_name: string;
        is_active: boolean;
        created_at: string | null;
        roles?: { code?: string; name?: string } | null;
      };
      const roleCodeRaw = String(record.roles?.code ?? "");
      if (!isRoleCode(roleCodeRaw)) {
        return null;
      }
      return {
        id: Number(record.id),
        userId: String(record.user_id),
        displayName: String(record.display_name),
        role: roleCodeRaw,
        roleName: String(record.roles?.name ?? roleCodeRaw),
        isActive: Boolean(record.is_active),
        createdAt: record.created_at ?? null,
      } satisfies AdminUserRow;
    })
    .filter((row): row is AdminUserRow => row !== null);
}
