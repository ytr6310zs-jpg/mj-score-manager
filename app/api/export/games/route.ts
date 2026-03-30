import { NextResponse } from "next/server";
import { fetchMatchResults } from "@/lib/matches";
import { makeGamesResponse } from "./handler";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const start = url.searchParams.get("start") ?? "";
  const end = url.searchParams.get("end") ?? "";

  const { matches, error } = await fetchMatchResults(start || undefined, end || undefined);
  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  const { csv, headers } = makeGamesResponse(matches, { start: start || undefined, end: end || undefined });
  return new Response(csv, { status: 200, headers });
}
