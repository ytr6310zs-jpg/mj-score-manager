"use server";

import { createClient } from "@supabase/supabase-js";

export type YakumanTypeActionState = {
  success: boolean;
  message: string;
  id?: number;
};

function parseString(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function addYakumanTypeAction(
  _prev: YakumanTypeActionState | undefined,
  formData: FormData
): Promise<YakumanTypeActionState> {
  const code = parseString(formData.get("code"));
  const name = parseString(formData.get("name"));
  const pointsRaw = parseString(formData.get("points"));
  const description = parseString(formData.get("description"));
  const sortOrderRaw = parseString(formData.get("sort_order"));

  if (!code || !name) {
    return { success: false, message: "コードと名前は必須です。" };
  }
  if (code.length > 50) return { success: false, message: "コードは50文字以内にしてください。" };

  const points = pointsRaw ? Number(pointsRaw) : null;
  const sort_order = sortOrderRaw ? Number(sortOrderRaw) : 100;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { success: false, message: "Supabase 連携用の環境変数が不足しています。" };
  }

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  try {
    // check existing code
    const { data: existing, error: selErr } = await supabase.from("yakuman_types").select("id").eq("code", code).limit(1);
    if (selErr) {
      console.error(selErr);
      return { success: false, message: "役満種別の確認に失敗しました。" };
    }
    if (existing && (existing as Array<Record<string, unknown>>).length > 0) {
      return { success: false, message: `コード「${code}」は既に存在します。` };
    }

    const payload = {
      code,
      name,
      points: points ?? null,
      description: description || null,
      sort_order: Number.isFinite(sort_order) ? sort_order : 100,
      is_active: true,
    } as Record<string, unknown>;

    const { data: inserted, error: insErr } = await supabase.from("yakuman_types").insert([payload]).select("id");
    if (insErr) {
      console.error(insErr);
      return { success: false, message: "役満種別の追加に失敗しました。" };
    }
    const id = Number((inserted && (inserted as Array<Record<string, unknown>>)[0]?.id) ?? 0);
    return { success: true, message: "役満種別を追加しました。", id };
  } catch (err) {
    console.error(err);
    return { success: false, message: "役満種別の追加に失敗しました。" };
  }
}

export async function editYakumanTypeAction(
  _prev: YakumanTypeActionState | undefined,
  formData: FormData
): Promise<YakumanTypeActionState> {
  const idRaw = parseString(formData.get("id"));
  const id = idRaw ? Number(idRaw) : NaN;
  const name = parseString(formData.get("name"));
  const pointsRaw = parseString(formData.get("points"));
  const description = parseString(formData.get("description"));
  const sortOrderRaw = parseString(formData.get("sort_order"));
  const isActiveRaw = parseString(formData.get("is_active"));

  if (!id || Number.isNaN(id)) return { success: false, message: "無効なIDです。" };
  if (!name) return { success: false, message: "名前は必須です。" };

  const points = pointsRaw ? Number(pointsRaw) : null;
  const sort_order = sortOrderRaw ? Number(sortOrderRaw) : 100;
  const is_active = isActiveRaw === "true" || isActiveRaw === "1";

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { success: false, message: "Supabase 連携用の環境変数が不足しています。" };
  }

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  try {
    const { error } = await supabase
      .from("yakuman_types")
      .update({ name, points: points ?? null, description: description || null, sort_order: Number.isFinite(sort_order) ? sort_order : 100, is_active })
      .eq("id", id)
      .limit(1);
    if (error) {
      console.error(error);
      return { success: false, message: "役満種別の更新に失敗しました。" };
    }
    return { success: true, message: "役満種別を更新しました。", id };
  } catch (err) {
    console.error(err);
    return { success: false, message: "役満種別の更新に失敗しました。" };
  }
}

export async function deleteYakumanTypeAction(
  _prev: YakumanTypeActionState | undefined,
  formData: FormData
): Promise<YakumanTypeActionState> {
  const idRaw = parseString(formData.get("id"));
  const id = idRaw ? Number(idRaw) : NaN;
  if (!id || Number.isNaN(id)) return { success: false, message: "無効なIDです。" };

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { success: false, message: "Supabase 連携用の環境変数が不足しています。" };
  }

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  try {
    // hard delete: remove the row from the table
    const { error } = await supabase.from("yakuman_types").delete().eq("id", id).limit(1);
    if (error) {
      console.error(error);
      return { success: false, message: "役満種別の削除に失敗しました。" };
    }
    return { success: true, message: "役満種別を削除しました。", id };
  } catch (err) {
    console.error(err);
    return { success: false, message: "役満種別の削除に失敗しました。" };
  }
}

// lightweight form adapters
import { redirect } from "next/navigation";

export async function addYakumanTypeFormAction(formData: FormData) {
  const res = await addYakumanTypeAction(undefined, formData);
  if (res.success) {
    // navigate to the list to ensure the UI shows the saved state
    redirect("/admin/yakumans");
  }
  return;
}
export async function editYakumanTypeFormAction(formData: FormData) {
  const res = await editYakumanTypeAction(undefined, formData);
  if (res.success) {
    // refresh the admin list view after successful edit
    redirect("/admin/yakumans");
  }
  return;
}
export async function deleteYakumanTypeFormAction(formData: FormData) {
  const res = await deleteYakumanTypeAction(undefined, formData);
  if (res.success) {
    // navigate back to the list so the disabled item is no longer shown as active
    redirect("/admin/yakumans");
  }
  return;
}
