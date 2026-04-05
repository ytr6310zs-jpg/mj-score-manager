"use server";

import { createClient } from "@supabase/supabase-js";


export type AddPlayerState = {
  success: boolean;
  message: string;
  name?: string;
};

export async function addPlayerAction(
  _prevState: AddPlayerState | undefined,
  formData: FormData
): Promise<AddPlayerState> {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { success: false, message: "名前を入力してください。" };
  }
  if (name.length > 20) {
    return { success: false, message: "名前は20文字以内で入力してください。" };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { success: false, message: "Supabase 連携用の環境変数が不足しています。" };
  }

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  try {
    // check existing by exact name
    const { data: existing, error: selErr } = await supabase
      .from("players")
      .select("name")
      .eq("name", name);
    if (selErr) {
      console.error(selErr);
      return { success: false, message: "プレイヤーの確認に失敗しました。" };
    }

    const existingNames = (existing || []).map((r: Record<string, unknown>) => String(r.name ?? "").trim());
    if (existingNames.includes(name)) {
      return { success: false, message: `「${name}」はすでに登録されています。` };
    }

    const { error: insErr } = await supabase.from("players").insert([{ name, display_name: name }]);
    if (insErr) {
      console.error(insErr);
      // Handle unique constraint (duplicate) more gracefully
      // Postgres unique_violation error code is '23505'
      if (insErr.code === "23505" || String(insErr.message ?? "").toLowerCase().includes("duplicate")) {
        return { success: false, message: `「${name}」はすでに登録されています。` };
      }
      return { success: false, message: "プレイヤーの追加に失敗しました。" };
    }

    return { success: true, message: `「${name}」を追加しました。`, name };
  } catch (err) {
    console.error(err);
    return { success: false, message: "プレイヤーの追加に失敗しました。" };
  }
}

export type DeletePlayerState = {
  success: boolean;
  message: string;
};

export async function deletePlayerAction(
  _prevState: DeletePlayerState | undefined,
  formData: FormData
): Promise<DeletePlayerState> {
  const idRaw = String(formData.get("id") ?? "").trim();
  const id = Number(idRaw);
  if (!id || Number.isNaN(id)) {
    return { success: false, message: "プレイヤーIDが不正です。" };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { success: false, message: "Supabase 連携用の環境変数が不足しています。" };
  }

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  try {
    const { error } = await supabase.from("players").delete().eq("id", id).limit(1);
    if (error) {
      console.error("Delete player error:", error);
      return { success: false, message: "プレイヤーの削除に失敗しました。" };
    }

    return { success: true, message: "プレイヤーを削除しました。" };
  } catch (err) {
    console.error(err);
    return { success: false, message: "プレイヤーの削除に失敗しました。" };
  }
}

export type EditPlayerState = {
  success: boolean;
  message: string;
  name?: string;
};

export async function editPlayerAction(
  _prevState: EditPlayerState | undefined,
  formData: FormData
): Promise<EditPlayerState> {
  const idRaw = String(formData.get("id") ?? "").trim();
  const id = Number(idRaw);
  const name = String(formData.get("name") ?? "").trim();

  if (!id || Number.isNaN(id)) {
    return { success: false, message: "プレイヤーIDが不正です。" };
  }
  if (!name) {
    return { success: false, message: "名前を入力してください。" };
  }
  if (name.length > 50) {
    return { success: false, message: "名前は50文字以内で入力してください。" };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { success: false, message: "Supabase 連携用の環境変数が不足しています。" };
  }

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  try {
    const { error } = await supabase.from("players").update({ name }).eq("id", id).limit(1);
    if (error) {
      console.error("Edit player error:", error);
      return { success: false, message: "プレイヤー名の更新に失敗しました。" };
    }

    return { success: true, message: "プレイヤー名を更新しました。", name };
  } catch (err) {
    console.error(err);
    return { success: false, message: "プレイヤー名の更新に失敗しました。" };
  }
}

// Lightweight wrappers that adapt existing server actions to be used directly
// as form `action` handlers (they return void / Promise<void> as expected).
export async function addPlayerFormAction(formData: FormData) {
  await addPlayerAction(undefined, formData);
}

export async function editPlayerFormAction(formData: FormData) {
  await editPlayerAction(undefined, formData);
}

export async function deletePlayerFormAction(formData: FormData) {
  await deletePlayerAction(undefined, formData);
}
