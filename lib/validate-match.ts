const NONE_VALUE = "__none__";
const SCORE_TOLERANCE = 1;

export type GameType = "3p" | "4p";

export type GameEntry = {
  slot: number;
  player: string;
  score: number;
  rank: number;
  isTobi: boolean;
  isTobashi: boolean;
  isYakitori: boolean;
};

function parseGameType(value: FormDataEntryValue | null): GameType {
  return value === "4p" ? "4p" : "3p";
}

function parseString(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function parseOptionalPlayer(value: FormDataEntryValue | null) {
  const parsed = parseString(value);
  return !parsed || parsed === NONE_VALUE ? null : parsed;
}

function parseScore(value: FormDataEntryValue | null) {
  const raw = parseString(value);
  if (!raw) {
    return null;
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < -1000 || parsed > 1000) {
    return null;
  }

  return parsed;
}

export type ParsedMatchData = {
  gameDate: string;
  gameType: GameType;
  activeSlots: number[];
  players: string[];
  scores: number[];
  tobiPlayers: string[];
  tobashiPlayer: string | null;
  yakitoriPlayers: Set<string>;
  notes: string;
  total: number;
};

export function validateAndParseMatchForm(formData: FormData): { ok: true; data: ParsedMatchData } | { ok: false; message: string } {
  const gameDate = parseString(formData.get("gameDate"));
  if (!gameDate) {
    return { ok: false, message: "対局日を入力してください" };
  }

  const gameType = parseGameType(formData.get("gameType"));
  const activeSlots = gameType === "4p" ? [1, 2, 3, 4] : [1, 2, 3];

  const players = activeSlots.map((slot) => parseString(formData.get(`player${slot}`)));
  for (const [index, player] of players.entries()) {
    if (!player) {
      return { ok: false, message: `プレイヤー${index + 1}を選択してください` };
    }
  }

  if (new Set(players).size !== players.length) {
    return {
      ok: false,
      message: `${gameType === "4p" ? "4名" : "3名"}とも別の名前を選択してください。`,
    };
  }

  const scores = activeSlots.map((slot, index) => {
    const score = parseScore(formData.get(`score${slot}`));
    return { index, score };
  });

  const invalidScore = scores.find(({ score }) => score === null);
  if (invalidScore) {
    return { ok: false, message: `スコア${invalidScore.index + 1}は -1000 から 1000 の整数で入力してください。` };
  }

  const resolvedScores = scores.map(({ score }) => score as number);
  const total = resolvedScores.reduce((sum, score) => sum + score, 0);

  if (Math.abs(total) > SCORE_TOLERANCE) {
    return {
      ok: false,
      message: "最終スコア合計は 0 にしてください。四捨五入の記載誤差として ±1 までは許容しています。",
    };
  }

  const tobiPlayersRaw = parseString(formData.get("tobiPlayers"));
  const tobiPlayers = tobiPlayersRaw
    ? Array.from(new Set(
      tobiPlayersRaw
        .split(",")
        .map((name) => name.trim())
        .filter((name) => name && name !== NONE_VALUE)
    ))
    : (() => {
      const single = parseOptionalPlayer(formData.get("tobiPlayer"));
      return single ? [single] : [];
    })();
  const tobashiPlayer = parseOptionalPlayer(formData.get("tobashiPlayer"));
  const yakitoriPlayers = new Set(
    activeSlots
      .filter((slot) => formData.get(`yakitori${slot}`) === "on")
      .map((slot, index) => players[index])
      .filter(Boolean)
  );

  if ((tobiPlayers.length > 0 && !tobashiPlayer) || (tobiPlayers.length === 0 && tobashiPlayer)) {
    return { ok: false, message: "飛びと飛ばしは両方セットで指定してください。" };
  }

  if (tobiPlayers.some((player) => !players.includes(player))) {
    return { ok: false, message: "飛び対象は同卓プレイヤーから選択してください。" };
  }

  if (tobashiPlayer && !players.includes(tobashiPlayer)) {
    return { ok: false, message: "飛ばし者は同卓プレイヤーから選択してください。" };
  }

  if (tobashiPlayer && tobiPlayers.includes(tobashiPlayer)) {
    return { ok: false, message: "飛び対象と飛ばし者に同じプレイヤーは指定できません。" };
  }

  const notes = parseString(formData.get("notes"));

  return {
    ok: true,
    data: {
      gameDate,
      gameType,
      activeSlots,
      players,
      scores: resolvedScores,
      tobiPlayers,
      tobashiPlayer,
      yakitoriPlayers,
      notes,
      total,
    },
  };
}

export function buildRankedEntries(
  players: string[],
  scores: number[],
  yakitoriPlayers: Set<string>,
  tobiPlayers: string[],
  tobashiPlayer: string | null
) {
  const ranked = players
    .map((player, index) => ({
      slot: index + 1,
      player,
      score: scores[index],
    }))
    .sort((left, right) => right.score - left.score || left.slot - right.slot)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  const rankBySlot = new Map(ranked.map((entry) => [entry.slot, entry.rank]));

  return players.map((player, index) => ({
    slot: index + 1,
    player,
    score: scores[index],
    rank: rankBySlot.get(index + 1) ?? players.length,
    isTobi: tobiPlayers.includes(player),
    isTobashi: tobashiPlayer === player,
    isYakitori: yakitoriPlayers.has(player),
  })) as GameEntry[];
}

// no default export
