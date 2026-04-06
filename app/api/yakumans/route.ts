import { YAKUMANS } from "@/lib/yakumans";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

  // If Supabase not configured, return fallback static list
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      YAKUMANS.map((y) => ({ code: y.code, name: y.name, points: y.points }))
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    const { data, error } = await supabase
      .from("yakuman_types")
      .select("code,name,points,description,sort_order,is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error || !data) {
      console.error("GET /api/yakumans supabase error:", error);
      return NextResponse.json(
        YAKUMANS.map((y) => ({ code: y.code, name: y.name, points: y.points }))
      );
    }

    const normalized = (data as Array<Record<string, unknown>>).map((r) => ({
      code: String(r["code"] ?? ""),
      name: String(r["name"] ?? ""),
      points: r["points"] === null || r["points"] === undefined ? null : Number(r["points"]),
      description: r["description"] ? String(r["description"]) : undefined,
    }));

    return NextResponse.json(normalized);
  } catch (err) {
    console.error("GET /api/yakumans error:", err);
    return NextResponse.json(
      YAKUMANS.map((y) => ({ code: y.code, name: y.name, points: y.points }))
    );
  }
}
