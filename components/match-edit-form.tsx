"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { editMatchAction, type EditMatchState } from "@/app/match-actions";
import { addYakumanAction, type YakumanActionState } from "@/app/yakuman-actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlayerSelect } from "@/components/ui/player-select";
import type { MatchResult } from "@/lib/matches";

const initialState: EditMatchState = {
  success: false,
  message: "",
};

const NONE_VALUE = "__none__";

type GameType = "3p" | "4p";

type PlayerSelection = {
  1: string;
  2: string;
  3: string;
  4: string;
};

interface MatchEditFormProps {
  match: MatchResult;
  players: string[];
  createdAt: string;
}

export function MatchEditForm({ match, players: playerList, createdAt }: MatchEditFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(editMatchAction, initialState);
  const [pending, startTransition] = useTransition();
  const [clientError, setClientError] = useState<string | null>(null);
  const [gameType, setGameType] = useState<GameType>(match.gameType);
  const [gameDate, setGameDate] = useState(match.date);
  const [players, setPlayers] = useState<PlayerSelection>({
    1: match.players[0]?.name ?? "",
    2: match.players[1]?.name ?? "",
    3: match.players[2]?.name ?? "",
    4: match.players[3]?.name ?? "",
  });
  const [scores, setScores] = useState({
    1: String(match.players[0]?.score ?? ""),
    2: String(match.players[1]?.score ?? ""),
    3: String(match.players[2]?.score ?? ""),
    4: String(match.players[3]?.score ?? ""),
  });
  const [autoFilledSlot, setAutoFilledSlot] = useState<number | null>(null);
  const [tobiPlayer, setTobiPlayer] = useState(match.tobiPlayer || NONE_VALUE);
  const [tobashiPlayer, setTobashiPlayer] = useState(match.tobashiPlayer || NONE_VALUE);
  const [yakitoriFlags, setYakitoriFlags] = useState<Record<number, boolean>>({
    1: match.players[0]?.isYakitori ?? false,
    2: match.players[1]?.isYakitori ?? false,
    3: match.players[2]?.isYakitori ?? false,
    4: match.players[3]?.isYakitori ?? false,
  });
  const [notes, setNotes] = useState(match.notes);
  const [yakumanCodeBySlot, setYakumanCodeBySlot] = useState<Record<number, string>>({
    1: "",
    2: "",
    3: "",
    4: "",
  });
  const [yakumanNameBySlot, setYakumanNameBySlot] = useState<Record<number, string>>({
    1: "",
    2: "",
    3: "",
    4: "",
  });
  const [yakumanPointsBySlot, setYakumanPointsBySlot] = useState<Record<number, string>>({
    1: "",
    2: "",
    3: "",
    4: "",
  });
  const [yakumanState, yakumanAction] = useActionState(addYakumanAction, {
    success: false,
    message: "",
  } as YakumanActionState);

  const activeSlots = useMemo(() => (gameType === "4p" ? [1, 2, 3, 4] : [1, 2, 3]), [gameType]);

  function handleScoreChange(slot: number, value: string) {
    if (slot === autoFilledSlot || value === "") {
      setAutoFilledSlot(null);
    }
    setScores((prev) => ({ ...prev, [slot]: value }));
  }

  function handleScoreBlur(slot: number) {
    const currentValue = scores[slot as keyof typeof scores];
    if (!currentValue) return;

    const otherSlots = activeSlots.filter((s) => s !== slot);
    const emptyOtherSlots = otherSlots.filter((s) => {
      const value = scores[s as keyof typeof scores];
      return value === undefined || value === "";
    });

    if (emptyOtherSlots.length === 1) {
      const target = emptyOtherSlots[0];
      const filledSum = activeSlots
        .filter((s) => s !== target)
        .reduce((acc, s) => acc + Number(scores[s as keyof typeof scores] || 0), 0);
      setScores((prev) => ({ ...prev, [target]: String(-filledSum) }));
      setAutoFilledSlot(target);
    }
  }

  function clearScore(slot: number) {
    setScores((prev) => ({ ...prev, [slot]: "" }));
    if (slot === autoFilledSlot) {
      setAutoFilledSlot(null);
    }
    setClientError(null);
  }

  function stepScore(slot: number, delta: number) {
    setScores((prev) => {
      const current = Number(prev[slot as keyof typeof prev] || 0);
      const next = Number.isFinite(current) ? current + delta : delta;
      return { ...prev, [slot]: String(next) };
    });
    if (slot === autoFilledSlot) {
      setAutoFilledSlot(null);
    }
    setClientError(null);
  }

  useEffect(() => {
    if (state.success) {
      router.push("/matches?flash=updated");
    }
  }, [state.success, router]);

  useEffect(() => {
    const scoreCount = gameType === "4p" ? 4 : 3;
    const playerScores: Record<string, string> = Object.fromEntries(
      new Array(scoreCount)
        .fill(null)
        .map((_, i) => {
          const slot = i + 1;
          const player = players[slot as keyof PlayerSelection];
          const scoreStr = scores[slot as keyof typeof scores];
          return [player, scoreStr];
        })
        .filter(([p]) => p)
    );
    const total = Object.values(playerScores)
      .map((s) => {
        const n = Number(s);
        return Number.isFinite(n) ? n : 0;
      })
      .reduce((a, b) => a + b, 0);

    if (Math.abs(total) < 1) {
      setClientError(null);
    } else {
      setClientError(
        total > 0 ? `スコア合計が${total}超過しています` : `スコア合計が${Math.abs(total)}不足しています`
      );
    }
  }, [gameType, players, scores]);

  useEffect(() => {
    if (gameType === "3p") {
      setPlayers((current) => ({ ...current, 4: "" }));
      setScores((current) => ({ ...current, 4: "" }));
      setYakitoriFlags((current) => ({ ...current, 4: false }));
      if (autoFilledSlot === 4) {
        setAutoFilledSlot(null);
      }
    }
  }, [gameType, autoFilledSlot]);

  const playersToCheck = activeSlots
    .map((slot) => players[slot as keyof PlayerSelection])
    .filter(Boolean);
  const createFormData = () => {
    const form = new FormData();
    form.append("createdAt", createdAt);
    form.append("gameDate", gameDate);
    form.append("gameType", gameType);
    activeSlots.forEach((slot) => {
      form.append(`player${slot}`, players[slot as keyof PlayerSelection]);
      form.append(`score${slot}`, scores[slot as keyof typeof scores]);
      form.append(`yakitori${slot}`, yakitoriFlags[slot] ? "on" : "off");
    });
    form.append("tobiPlayer", tobiPlayer === NONE_VALUE ? "" : tobiPlayer);
    form.append("tobashiPlayer", tobashiPlayer === NONE_VALUE ? "" : tobashiPlayer);
    form.append("notes", notes);
    return form;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setClientError(null);
    const form = createFormData();
    startTransition(() => {
      formAction(form);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="gameDate" className="mb-2 block">
            対局日 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="gameDate"
            type="date"
            value={gameDate}
            onChange={(e) => setGameDate(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="gameType" className="mb-2 block">
            ゲームタイプ <span className="text-destructive">*</span>
          </Label>
          <Select value={gameType} onValueChange={(value) => setGameType(value as GameType)}>
            <SelectTrigger id="gameType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3p">3人打ち</SelectItem>
              <SelectItem value="4p">4人打ち</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-emerald-900">プレイヤーとスコア</h3>
        {activeSlots.map((slot) => (
          <div key={slot} className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 sm:p-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label className="mb-2 block text-sm">
                  プレイヤー{slot} <span className="text-destructive">*</span>
                </Label>
                <PlayerSelect
                  name={`player${slot}`}
                  value={players[slot as keyof PlayerSelection]}
                  onValueChange={(value) => {
                    setPlayers((prev) => ({ ...prev, [slot]: value }));
                    if (value === tobiPlayer) setTobiPlayer(NONE_VALUE);
                    if (value === tobashiPlayer) setTobashiPlayer(NONE_VALUE);
                  }}
                  options={playerList}
                  required
                />
              </div>
              <div>
                <Label htmlFor={`score${slot}`} className="mb-2 block text-sm">
                  スコア <span className="text-destructive">*</span>
                  {autoFilledSlot === slot ? (
                    <span className="ml-2 text-xs font-normal text-emerald-600">（自動入力）</span>
                  ) : null}
                </Label>
                <div className="relative">
                  <Input
                    id={`score${slot}`}
                    type="number"
                    value={scores[slot as keyof typeof scores]}
                    onChange={(e) => handleScoreChange(slot, e.target.value)}
                    onBlur={() => handleScoreBlur(slot)}
                    placeholder="例: +100"
                    required
                    className={
                      autoFilledSlot === slot
                        ? "border-emerald-300 bg-emerald-50 pr-10 sm:pr-16 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        : "pr-10 sm:pr-16 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    }
                  />
                  {scores[slot as keyof typeof scores] ? (
                    <button
                      type="button"
                      onClick={() => clearScore(slot)}
                      aria-label={`スコア${slot}をクリア`}
                      className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:right-9"
                    >
                      ×
                    </button>
                  ) : null}
                  <div className="absolute right-1 top-1/2 hidden -translate-y-1/2 sm:flex sm:flex-col">
                    <button
                      type="button"
                      onClick={() => stepScore(slot, 1)}
                      aria-label={`スコア${slot}を1増やす`}
                      className="inline-flex h-3 w-6 items-center justify-center rounded-t text-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => stepScore(slot, -1)}
                      aria-label={`スコア${slot}を1減らす`}
                      className="inline-flex h-3 w-6 items-center justify-center rounded-b text-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={yakitoriFlags[slot]}
                onChange={(e) => setYakitoriFlags((prev) => ({ ...prev, [slot]: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium text-emerald-900">焼き鳥</span>
            </label>
            <div className="mt-3 space-y-2">
              <h4 className="text-sm font-medium">役満を追加</h4>
              <div className="grid gap-2 sm:grid-cols-3">
                <Input
                  placeholder="コード (例: DA)"
                  value={yakumanCodeBySlot[slot] ?? ""}
                  onChange={(e) => setYakumanCodeBySlot((p) => ({ ...p, [slot]: e.target.value }))}
                />
                <Input
                  placeholder="名称 (例: 大三元)"
                  value={yakumanNameBySlot[slot] ?? ""}
                  onChange={(e) => setYakumanNameBySlot((p) => ({ ...p, [slot]: e.target.value }))}
                />
                <Input
                  placeholder="点数 (例: 32000)"
                  value={yakumanPointsBySlot[slot] ?? ""}
                  onChange={(e) => setYakumanPointsBySlot((p) => ({ ...p, [slot]: e.target.value }))}
                />
              </div>
              <div className="pt-2">
                <Button
                  type="button"
                  onClick={() => {
                    setClientError(null);
                    const playerName = players[slot as keyof PlayerSelection];
                    if (!playerName) {
                      setClientError("プレイヤーを選択してください。役満を追加できません。");
                      return;
                    }
                    const form = new FormData();
                    form.append("createdAt", createdAt);
                    form.append("playerName", playerName);
                    form.append("yakumanCode", yakumanCodeBySlot[slot] ?? "");
                    form.append("yakumanName", yakumanNameBySlot[slot] ?? "");
                    form.append("points", yakumanPointsBySlot[slot] ?? "");
                    startTransition(() => {
                      // call server action to add yakuman
                      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                      // @ts-ignore
                      yakumanAction(form);
                    });
                  }}
                >
                  役満を追加
                </Button>
                {yakumanState?.message ? (
                  <div className="mt-2 text-sm text-emerald-800">{yakumanState.message}</div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2 border-b border-emerald-200 pb-4">
        <Label htmlFor="tobiPlayer" className="mb-2 block">
          飛び / 飛ばし
        </Label>
        <div className="grid gap-2 sm:grid-cols-2">
          <Select value={tobiPlayer} onValueChange={setTobiPlayer}>
            <SelectTrigger id="tobiPlayer">
              <SelectValue placeholder="飛び対象" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>なし</SelectItem>
              {playersToCheck.map((player) => (
                <SelectItem key={`tobi-${player}`} value={player}>
                  {player} が飛び
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tobashiPlayer} onValueChange={setTobashiPlayer}>
            <SelectTrigger>
              <SelectValue placeholder="飛ばし者" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>なし</SelectItem>
              {playersToCheck.map((player) => (
                <SelectItem key={`tobashi-${player}`} value={player}>
                  {player} が飛ばし
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="notes" className="mb-2 block">
          備考
        </Label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="例: 麻雀ゲーム"
          className="flex min-h-24 w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {clientError && (
        <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
          <AlertDescription>{clientError}</AlertDescription>
        </Alert>
      )}

      {state.message && (
        <Alert
          className={state.success ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-destructive/40 bg-destructive/5 text-destructive"}
        >
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2 pt-4 sm:flex-row">
        <Button type="submit" disabled={pending || clientError !== null} className="w-full flex-1">
          {pending ? "編集中..." : "対局を編集"}
        </Button>
        <Button type="button" variant="outline" onClick={() => window.history.back()} className="w-full sm:w-auto">
          キャンセル
        </Button>
      </div>
    </form>
  );
}
