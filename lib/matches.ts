import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";

export type MatchPlayer = {
  slot: number;
  name: string;
  score: number;
  rank: number;
  isTobi: boolean;
  isTobashi: boolean;
  isYakitori: boolean;
};

export type MatchResult = {
  date: string;
  gameType: "3p" | "4p";
  playerCount: number;
  scoreTotal: number;
  topPlayer: string;
  lastPlayer: string;
  tobiPlayer: string;
  tobashiPlayer: string;
  yakitoriPlayers: string[];
  notes: string;
  createdAt: string;
  players: MatchPlayer[];
};

function toBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toUpperCase();
    return normalized === "TRUE" || normalized === "1";
  }
  if (typeof value === "number") return value !== 0;
  return false;
}

function toInt(value: unknown): number {
  if (typeof value === "number") return Math.round(value);
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? Math.round(parsed) : 0;
  }
  return 0;
}

function toString(value: unknown): string {
  return String(value ?? "").trim();
}

function parseEpoch(value: string): number {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function fetchMatchResults(): Promise<{
  matches: MatchResult[];
  error: string | null;
}> {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY;
  const sheetTitle = process.env.GOOGLE_SHEET_TITLE;

  if (!spreadsheetId || !serviceAccountEmail || !privateKeyRaw) {
    return {
      matches: [],
      error: "Google Sheets 連携用の環境変数が不足しています。",
    };
  }

  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

  try {
    const auth = new JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const doc = new GoogleSpreadsheet(spreadsheetId, auth);
    await doc.loadInfo();

    const sheet = sheetTitle ? doc.sheetsByTitle[sheetTitle] : doc.sheetsByIndex[0];

    if (!sheet) {
      return { matches: [], error: "指定されたシートが見つかりません。" };
    }

    const rows = await sheet.getRows();
    const matches: MatchResult[] = rows.map((row) => {
      const playerCount = toInt(row.get("playerCount")) || 3;
      const slots = playerCount >= 4 ? [1, 2, 3, 4] : [1, 2, 3];

      const players = slots
        .map((slot) => {
          const name = toString(row.get(`player${slot}`));
          if (!name) return null;

          return {
            slot,
            name,
            score: toInt(row.get(`score${slot}`)),
            rank: toInt(row.get(`rank${slot}`)) || slots.length,
            isTobi: toBool(row.get(`isTobi${slot}`)),
            isTobashi: toBool(row.get(`isTobashi${slot}`)),
            isYakitori: toBool(row.get(`isYakitori${slot}`)),
          } satisfies MatchPlayer;
        })
        .filter((player): player is MatchPlayer => player !== null)
        .sort((left, right) => left.rank - right.rank || left.slot - right.slot);

      return {
        date: toString(row.get("date")),
        gameType: toString(row.get("gameType")) === "4p" ? "4p" : "3p",
        playerCount,
        scoreTotal: toInt(row.get("scoreTotal")),
        topPlayer: toString(row.get("topPlayer")),
        lastPlayer: toString(row.get("lastPlayer")),
        tobiPlayer: toString(row.get("tobiPlayer")),
        tobashiPlayer: toString(row.get("tobashiPlayer")),
        yakitoriPlayers: toString(row.get("yakitoriPlayers"))
          .split(",")
          .map((name) => name.trim())
          .filter(Boolean),
        notes: toString(row.get("notes")),
        createdAt: toString(row.get("createdAt")),
        players,
      };
    });

    matches.sort((left, right) => {
      const byDate = left.date.localeCompare(right.date);
      if (byDate !== 0) return -byDate;

      const byCreatedAt = parseEpoch(left.createdAt) - parseEpoch(right.createdAt);
      return -byCreatedAt;
    });

    return {
      matches,
      error: null,
    };
  } catch {
    return {
      matches: [],
      error: "対局履歴の取得に失敗しました。環境変数・権限・シート名を確認してください。",
    };
  }
}