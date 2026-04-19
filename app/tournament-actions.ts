"use server";

import { createClient } from "@supabase/supabase-js";

export type TournamentActionState = {
  success: boolean;
  message: string;
  name?: string;
};

function parseString(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
}

export async function addTournamentAction(
  _prevState: TournamentActionState | undefined,
  formData: FormData
): Promise<TournamentActionState> {
  const name = parseString(formData.get("name"));

  if (!name) {
    return { success: false, message: "大会名を入力してください。" };
  }
  if (name.length > 50) {
    return { success: false, message: "大会名は50文字以内で入力してください。" };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, message: "Supabase 連携用の環境変数が不足しています。" };
  }

  try {
    const { data: existing, error: selectError } = await supabase
      .from("tournaments")
      .select("id")
      .eq("name", name)
      .limit(1);
    if (selectError) {
      console.error(selectError);
      return { success: false, message: "大会情報の確認に失敗しました。" };
    }
    if (existing && existing.length > 0) {
      return { success: false, message: `「${name}」はすでに登録されています。` };
    }

    const { error } = await supabase.from("tournaments").insert([{ name }]);
    if (error) {
      console.error(error);
      return { success: false, message: "大会の追加に失敗しました。" };
    }

    return { success: true, message: `「${name}」を追加しました。`, name };
  } catch (error) {
    console.error(error);
    return { success: false, message: "大会の追加に失敗しました。" };
  }
}

export async function editTournamentAction(
  _prevState: TournamentActionState | undefined,
  formData: FormData
): Promise<TournamentActionState> {
  const id = Number(parseString(formData.get("id")));
  const name = parseString(formData.get("name"));

  if (!Number.isInteger(id) || id <= 0) {
    return { success: false, message: "大会IDが不正です。" };
  }
  if (!name) {
    return { success: false, message: "大会名を入力してください。" };
  }
  if (name.length > 50) {
    return { success: false, message: "大会名は50文字以内で入力してください。" };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, message: "Supabase 連携用の環境変数が不足しています。" };
  }

  try {
    const { data: existing, error: selectError } = await supabase
      .from("tournaments")
      .select("id")
      .eq("name", name)
      .neq("id", id)
      .limit(1);
    if (selectError) {
      console.error(selectError);
      return { success: false, message: "大会情報の確認に失敗しました。" };
    }
    if (existing && existing.length > 0) {
      return { success: false, message: `「${name}」はすでに登録されています。` };
    }

    const { error } = await supabase.from("tournaments").update({ name }).eq("id", id).limit(1);
    if (error) {
      console.error(error);
      return { success: false, message: "大会名の更新に失敗しました。" };
    }

    return { success: true, message: "大会名を更新しました。", name };
  } catch (error) {
    console.error(error);
    return { success: false, message: "大会名の更新に失敗しました。" };
  }
}

export async function deleteTournamentAction(
  _prevState: TournamentActionState | undefined,
  formData: FormData
): Promise<TournamentActionState> {
  const id = Number(parseString(formData.get("id")));

  if (!Number.isInteger(id) || id <= 0) {
    return { success: false, message: "大会IDが不正です。" };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, message: "Supabase 連携用の環境変数が不足しています。" };
  }

  try {
    const { count, error: countError } = await supabase
      .from("games")
      .select("id", { count: "exact", head: true })
      .eq("tournament_id", id);
    if (countError) {
      console.error(countError);
      return { success: false, message: "大会データの確認に失敗しました。" };
    }
    if (Number(count ?? 0) > 0) {
      return { success: false, message: "この大会に対局データが存在するため削除できません。" };
    }

    const { error } = await supabase.from("tournaments").delete().eq("id", id).limit(1);
    if (error) {
      console.error(error);
      return { success: false, message: "大会の削除に失敗しました。" };
    }

    return { success: true, message: "大会を削除しました。" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "大会の削除に失敗しました。" };
  }
}

export async function addTournamentFormAction(formData: FormData) {
  await addTournamentAction(undefined, formData);
}

export async function editTournamentFormAction(formData: FormData) {
  await editTournamentAction(undefined, formData);
}

export async function deleteTournamentFormAction(formData: FormData) {
  await deleteTournamentAction(undefined, formData);
}