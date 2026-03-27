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
    // check existing by lower(name) to match unique index behavior
    const { data: existing, error: selErr } = await supabase
      .from("players")
      .select("name")
      .ilike("name", name);
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
      return { success: false, message: "プレイヤーの追加に失敗しました。" };
    }

    return { success: true, message: `「${name}」を追加しました。`, name };
  } catch (err) {
    console.error(err);
    return { success: false, message: "プレイヤーの追加に失敗しました。" };
  }
}
