"use client";

import { useActionState, useEffect, useMemo, useState } from "react";

import { saveScoreAction, type SaveScoreState } from "@/app/actions";
import { addPlayerAction } from "@/app/player-actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlayerSelect } from "@/components/ui/player-select";

const initialState: SaveScoreState = {
  success: false,
  message: "",
};

const NONE_VALUE = "__none__";

type GameType = "3p" | "4p";

type ScoreFormProps = {
  players: string[];
};

type PlayerSelection = {
  1: string;
  2: string;
  3: string;
  4: string;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function ScoreForm({ players: playerList }: ScoreFormProps) {
  const [state, formAction, pending] = useActionState(saveScoreAction, initialState);
  const [clientError, setClientError] = useState<string | null>(null);
  const [duplicatePlayerError, setDuplicatePlayerError] = useState<string | null>(null);
  const [gameType, setGameType] = useState<GameType>("3p");
  const [players, setPlayers] = useState<PlayerSelection>({
    1: "",
    2: "",
    3: "",
    4: "",
  });
  const [scores, setScores] = useState<Record<number, string>>({});
  const [autoFilledSlot, setAutoFilledSlot] = useState<number | null>(null);
  const [tobiPlayer, setTobiPlayer] = useState(NONE_VALUE);
  const [tobashiPlayer, setTobashiPlayer] = useState(NONE_VALUE);
  const [yakitoriSlots, setYakitoriSlots] = useState<Record<number, boolean>>({});

  const [playerOptions, setPlayerOptions] = useState<string[]>(playerList);

  async function handleAddPlayer(name: string): Promise<{ success: boolean; message: string }> {
    const formData = new FormData();
    formData.append("name", name);
    const result = await addPlayerAction(undefined, formData);
    if (result.success) {
      setPlayerOptions((prev) => [...prev, name]);
    }
    return result;
  }

  const activeSlots = useMemo(() => (gameType === "4p" ? [1, 2, 3, 4] : [1, 2, 3]), [gameType]);

  function handleScoreChange(slot: number, value: string) {
    // 自動入力済みのスロットを手動変更した場合はフラグをリセット
    if (slot === autoFilledSlot) {
      setAutoFilledSlot(null);
    }
    // 値が空になった場合も自動入力をリセット
    if (value === "") {
      setAutoFilledSlot(null);
    }
    setScores((prev) => ({ ...prev, [slot]: value }));
  }

  function handleScoreBlur(slot: number) {
    // フォーカスが外れたタイミングで残り1か所を自動計算
    const currentValue = scores[slot];
    if (currentValue === undefined || currentValue === "") return;

    const otherSlots = activeSlots.filter((s) => s !== slot);
    const emptyOtherSlots = otherSlots.filter((s) => scores[s] === undefined || scores[s] === "");

    if (emptyOtherSlots.length === 1) {
      const filledSum = activeSlots
        .filter((s) => s !== emptyOtherSlots[0])
        .reduce((acc, s) => acc + Number(scores[s] || 0), 0);
      setScores((prev) => ({ ...prev, [emptyOtherSlots[0]]: String(-filledSum) }));
      setAutoFilledSlot(emptyOtherSlots[0]);
    }
  }
  const activePlayers = activeSlots
    .map((slot) => ({ slot, name: players[slot as keyof PlayerSelection] }))
    .filter((entry) => entry.name);

  useEffect(() => {
    if (gameType === "3p") {
      setPlayers((current) => ({ ...current, 4: "" }));
      setScores((current) => { const next = { ...current }; delete next[4]; return next; });
      setYakitoriSlots((current) => {
        const next = { ...current };
        delete next[4];
        return next;
      });
      if (autoFilledSlot === 4) setAutoFilledSlot(null);
    }
  }, [gameType, autoFilledSlot]);

  useEffect(() => {
    const playerNames = new Set(activePlayers.map((entry) => entry.name));

    if (tobiPlayer !== NONE_VALUE && !playerNames.has(tobiPlayer)) {
      setTobiPlayer(NONE_VALUE);
    }

    if (tobashiPlayer !== NONE_VALUE && !playerNames.has(tobashiPlayer)) {
      setTobashiPlayer(NONE_VALUE);
    }
  }, [activePlayers, tobiPlayer, tobashiPlayer]);

  useEffect(() => {
    const selectedPlayers = activeSlots
      .map((slot) => players[slot as keyof PlayerSelection])
      .filter(Boolean);
    const uniquePlayers = new Set(selectedPlayers);

    if (uniquePlayers.size !== selectedPlayers.length) {
      setDuplicatePlayerError("同じプレイヤーを重複して選択できません。");
      return;
    }

    setDuplicatePlayerError(null);
  }, [activeSlots, players]);

  return (
    <Card className="w-full max-w-3xl border-white/70 bg-white/90 shadow-xl backdrop-blur">
      <CardHeader>
        <CardTitle className="text-2xl">麻雀成績入力</CardTitle>
        <CardDescription>
          3人打ち・4人打ちの最終スコア、飛び、焼き鳥を保存して後日の集計に使える形で記録します。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={formAction}
          className="space-y-6"
          onSubmit={(e) => {
            const slots = gameType === "4p" ? [1, 2, 3, 4] : [1, 2, 3];
            const selectedPlayers = slots.map(
              (slot) => players[slot as keyof PlayerSelection]
            );
            const uniquePlayers = new Set(selectedPlayers.filter(Boolean));
            const total = slots.reduce((sum, slot) => {
              const value = Number(scores[slot] || 0);
              return sum + value;
            }, 0);

            if (selectedPlayers.some((player) => !player)) {
              e.preventDefault();
              setClientError("同卓プレイヤーを全員選択してください。");
              return;
            }

            if (uniquePlayers.size !== selectedPlayers.length) {
              e.preventDefault();
              setClientError("同じプレイヤーを重複して選択できません。");
              return;
            }

            if (Math.abs(total) > 1) {
              e.preventDefault();
              setClientError(
                "送信できません。最終スコア合計は 0 にしてください。四捨五入の誤差として ±1 までは許容しています。"
              );
              return;
            }

            if (
              (tobiPlayer === NONE_VALUE && tobashiPlayer !== NONE_VALUE) ||
              (tobiPlayer !== NONE_VALUE && tobashiPlayer === NONE_VALUE)
            ) {
              e.preventDefault();
              setClientError("飛び対象と飛ばし者は両方セットで選択してください。");
              return;
            }

            if (tobiPlayer !== NONE_VALUE && tobiPlayer === tobashiPlayer) {
              e.preventDefault();
              setClientError("飛び対象と飛ばし者に同じプレイヤーは選べません。");
              return;
            }

            setClientError(null);
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>卓種</Label>
              <Select name="gameType" value={gameType} onValueChange={(value) => setGameType(value as GameType)}>
                <SelectTrigger>
                  <SelectValue placeholder="卓種を選択してください" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3p">3人打ち</SelectItem>
                  <SelectItem value="4p">4人打ち</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="gameDate">対局日</Label>
              <Input id="gameDate" name="gameDate" type="date" defaultValue={today()} required />
            </div>

            {activeSlots.map((slot) => (
              <div key={`slot-${slot}`} className="contents">
                <div key={`player-${slot}`} className="space-y-2">
                  <Label>{`プレイヤー${slot}`}</Label>
                  <PlayerSelect
                    name={`player${slot}`}
                    value={players[slot as keyof PlayerSelection]}
                    onValueChange={(value) =>
                      setPlayers((current) => ({
                        ...current,
                        [slot]: value,
                      }))
                    }
                    options={playerOptions}
                    onAddPlayer={handleAddPlayer}
                    required
                  />
                </div>

                <div key={`score-${slot}`} className="space-y-2">
                  <Label htmlFor={`score${slot}`}>
                    {`最終スコア${slot}`}
                    {autoFilledSlot === slot && (
                      <span className="ml-2 text-xs font-normal text-emerald-600">（自動入力）</span>
                    )}
                  </Label>
                  <Input
                    id={`score${slot}`}
                    name={`score${slot}`}
                    type="number"
                    step="1"
                    required
                    value={scores[slot] ?? ""}
                    onChange={(e) => handleScoreChange(slot, e.target.value)}
                    onBlur={() => handleScoreBlur(slot)}
                    className={autoFilledSlot === slot ? "bg-emerald-50 border-emerald-300" : ""}
                  />
                </div>
              </div>
            ))}

            <div className="space-y-2">
              <Label>飛び対象</Label>
              <Select name="tobiPlayer" value={tobiPlayer} onValueChange={setTobiPlayer}>
                <SelectTrigger>
                  <SelectValue placeholder="なし" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>なし</SelectItem>
                  {activePlayers.map((player) => (
                    <SelectItem key={`tobi-${player.name}`} value={player.name}>
                      {player.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>飛ばし者</Label>
              <Select name="tobashiPlayer" value={tobashiPlayer} onValueChange={setTobashiPlayer}>
                <SelectTrigger>
                  <SelectValue placeholder="なし" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>なし</SelectItem>
                  {activePlayers.map((player) => (
                    <SelectItem key={`tobashi-${player.name}`} value={player.name}>
                      {player.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>焼き鳥</Label>
              <div className="grid gap-3 rounded-md border border-border/70 bg-white/70 p-4 md:grid-cols-2">
                {activeSlots.map((slot) => {
                  const playerName = players[slot as keyof PlayerSelection];

                  return (
                    <label
                      key={`yakitori-${slot}-${playerName || "empty"}`}
                      className="flex items-center gap-3 text-sm"
                    >
                      <input
                        name={`yakitori${slot}`}
                        type="checkbox"
                        className="h-4 w-4 rounded border border-input"
                        checked={Boolean(yakitoriSlots[slot])}
                        disabled={!playerName}
                        onChange={(event) =>
                          setYakitoriSlots((current) => ({
                            ...current,
                            [slot]: event.target.checked,
                          }))
                        }
                      />
                      <span>{playerName || `プレイヤー${slot}を先に選択してください`}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">メモ</Label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="役満や備考があれば入力してください"
              />
            </div>
          </div>

          {clientError ? (
            <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
              <AlertDescription>{clientError}</AlertDescription>
            </Alert>
          ) : null}

          {duplicatePlayerError && !clientError ? (
            <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
              <AlertDescription>{duplicatePlayerError}</AlertDescription>
            </Alert>
          ) : null}

          {state.message ? (
            <Alert
              className={state.success ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-destructive/40 bg-destructive/5 text-destructive"}
            >
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" disabled={pending || duplicatePlayerError !== null} className="w-full md:w-auto">
            {pending ? "保存中..." : "スコアを保存"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
