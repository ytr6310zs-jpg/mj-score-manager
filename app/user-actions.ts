"use server";

import { hash } from "bcryptjs";

import { canAccessAdmin } from "@/lib/authorization";
import { getCurrentSession } from "@/lib/session";
import { getSupabaseServiceClient } from "@/lib/users";

export type UserActionState = {
  success: boolean;
  message: string;
};

function parseString(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

async function resolveRoleId(roleCode: string): Promise<number | null> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return null;

  const { data, error } = await supabase.from("roles").select("id").eq("code", roleCode).limit(1);
  if (error || !data || data.length === 0) {
    if (error) {
      console.error("resolveRoleId error:", error);
    }
    return null;
  }

  return Number(data[0].id ?? 0) || null;
}

async function countActiveAdmins(): Promise<number> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return 0;

  const { data, error } = await supabase
    .from("users")
    .select("id,is_active,roles(code)")
    .eq("is_active", true);

  if (error) {
    console.error("countActiveAdmins error:", error);
    return 0;
  }

  const rows = (data ?? []) as Array<{ roles?: { code?: string } | null }>;
  return rows.filter((row) => String(row.roles?.code ?? "") === "admin").length;
}

export async function addUserAction(
  _prevState: UserActionState | undefined,
  formData: FormData
): Promise<UserActionState> {
  const session = await getCurrentSession();
  if (!session || !canAccessAdmin(session.role)) {
    return { success: false, message: "この操作を実行する権限がありません。" };
  }

  const userId = parseString(formData.get("userId"));
  const displayName = parseString(formData.get("displayName"));
  const roleCode = parseString(formData.get("role"));
  const password = String(formData.get("password") ?? "");

  if (!userId || !displayName || !roleCode || !password) {
    return { success: false, message: "必須項目を入力してください。" };
  }
  if (password.length < 8) {
    return { success: false, message: "パスワードは8文字以上で入力してください。" };
  }

  const roleId = await resolveRoleId(roleCode);
  if (!roleId) {
    return { success: false, message: "権限が不正です。" };
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return { success: false, message: "Supabase 連携用の環境変数が不足しています。" };
  }

  const { data: existing, error: existingError } = await supabase
    .from("users")
    .select("id")
    .eq("user_id", userId)
    .limit(1);
  if (existingError) {
    console.error("addUserAction existing check error:", existingError);
    return { success: false, message: "ユーザーの確認に失敗しました。" };
  }
  if (existing && existing.length > 0) {
    return { success: false, message: "同じユーザーIDが既に存在します。" };
  }

  const passwordHash = await hash(password, 10);
  const { error } = await supabase.from("users").insert([
    {
      user_id: userId,
      display_name: displayName,
      password_hash: passwordHash,
      role_id: roleId,
      is_active: true,
      updated_at: new Date().toISOString(),
    },
  ]);

  if (error) {
    console.error("addUserAction insert error:", error);
    return { success: false, message: "ユーザーの追加に失敗しました。" };
  }

  return { success: true, message: "ユーザーを追加しました。" };
}

export async function editUserAction(
  _prevState: UserActionState | undefined,
  formData: FormData
): Promise<UserActionState> {
  const session = await getCurrentSession();
  if (!session || !canAccessAdmin(session.role)) {
    return { success: false, message: "この操作を実行する権限がありません。" };
  }

  const id = Number(parseString(formData.get("id")));
  const displayName = parseString(formData.get("displayName"));
  const roleCode = parseString(formData.get("role"));
  const password = String(formData.get("password") ?? "");
  const isActive = parseString(formData.get("isActive")) === "1";

  if (!Number.isInteger(id) || id <= 0 || !displayName || !roleCode) {
    return { success: false, message: "入力値が不正です。" };
  }

  const roleId = await resolveRoleId(roleCode);
  if (!roleId) {
    return { success: false, message: "権限が不正です。" };
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return { success: false, message: "Supabase 連携用の環境変数が不足しています。" };
  }

  const { data: targetRows, error: targetError } = await supabase
    .from("users")
    .select("id")
    .eq("id", id)
    .limit(1);
  if (targetError || !targetRows || targetRows.length === 0) {
    if (targetError) {
      console.error("editUserAction targetError:", targetError);
    }
    return { success: false, message: "対象ユーザーが見つかりません。" };
  }

  if ((roleCode !== "admin" || !isActive) && session.uid === id) {
    return { success: false, message: "自分自身の管理者権限を外すことはできません。" };
  }

  if (roleCode !== "admin" || !isActive) {
    const adminCount = await countActiveAdmins();
    if (adminCount <= 1) {
      const { data: roleRows } = await supabase
        .from("users")
        .select("roles(code)")
        .eq("id", id)
        .limit(1);
      const currentRole = String((roleRows?.[0] as { roles?: { code?: string } | null } | undefined)?.roles?.code ?? "");
      if (currentRole === "admin") {
        return { success: false, message: "最後の管理者を無効化または降格できません。" };
      }
    }
  }

  const payload: Record<string, unknown> = {
    display_name: displayName,
    role_id: roleId,
    is_active: isActive,
    updated_at: new Date().toISOString(),
  };

  if (password) {
    if (password.length < 8) {
      return { success: false, message: "パスワードは8文字以上で入力してください。" };
    }
    payload.password_hash = await hash(password, 10);
  }

  const { error } = await supabase.from("users").update(payload).eq("id", id).limit(1);
  if (error) {
    console.error("editUserAction update error:", error);
    return { success: false, message: "ユーザーの更新に失敗しました。" };
  }

  return { success: true, message: "ユーザーを更新しました。" };
}

export async function deleteUserAction(
  _prevState: UserActionState | undefined,
  formData: FormData
): Promise<UserActionState> {
  const session = await getCurrentSession();
  if (!session || !canAccessAdmin(session.role)) {
    return { success: false, message: "この操作を実行する権限がありません。" };
  }

  const id = Number(parseString(formData.get("id")));
  if (!Number.isInteger(id) || id <= 0) {
    return { success: false, message: "ユーザーIDが不正です。" };
  }

  if (session.uid === id) {
    return { success: false, message: "ログイン中のユーザーは削除できません。" };
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return { success: false, message: "Supabase 連携用の環境変数が不足しています。" };
  }

  const { data: roleRows, error: roleError } = await supabase
    .from("users")
    .select("roles(code)")
    .eq("id", id)
    .limit(1);

  if (roleError || !roleRows || roleRows.length === 0) {
    if (roleError) {
      console.error("deleteUserAction roleError:", roleError);
    }
    return { success: false, message: "対象ユーザーが見つかりません。" };
  }

  const targetRole = String((roleRows[0] as { roles?: { code?: string } | null }).roles?.code ?? "");
  if (targetRole === "admin") {
    const adminCount = await countActiveAdmins();
    if (adminCount <= 1) {
      return { success: false, message: "最後の管理者ユーザーは削除できません。" };
    }
  }

  const { error } = await supabase.from("users").delete().eq("id", id).limit(1);
  if (error) {
    console.error("deleteUserAction error:", error);
    return { success: false, message: "ユーザーの削除に失敗しました。" };
  }

  return { success: true, message: "ユーザーを削除しました。" };
}
