"use client";

import { useActionState, useEffect, useMemo, useState } from "react";

import { saveScoreAction, type SaveScoreState } from "@/app/actions";
import { addPlayerAction } from "@/app/player-actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlayerSelect } from "@/components/ui/player-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { YakumanSelectionPanel, type YakumanSelectionEntry } from "@/components/yakuman-selection-panel";
import useYakumans from "@/lib/useYakumans";

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
  const [tobiPlayers, setTobiPlayers] = useState<string[]>([]);
  const [tobashiPlayer, setTobashiPlayer] = useState(NONE_VALUE);
  const [yakitoriSlots, setYakitoriSlots] = useState<Record<number, boolean>>({});
  const [notes, setNotes] = useState("");
  const [pendingYakumans, setPendingYakumans] = useState<YakumanSelectionEntry[]>([]);

  const [playerOptions, setPlayerOptions] = useState<string[]>(playerList);
  const { yakumans } = useYakumans();

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

  function resetRoundFields() {
    setScores({});
    setAutoFilledSlot(null);
    setTobiPlayers([]);
    setTobashiPlayer(NONE_VALUE);
    setYakitoriSlots({});
    setNotes("");
    setPendingYakumans([]);
    setClientError(null);
  }

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

  function clearScore(slot: number) {
    setScores((prev) => {
      const next = { ...prev };
      delete next[slot];
      return next;
    });

    if (slot === autoFilledSlot) {
      setAutoFilledSlot(null);
    }

    setClientError(null);
  }

  function stepScore(slot: number, delta: number) {
    setScores((prev) => {
      const current = Number(prev[slot] || 0);
      const next = Number.isFinite(current) ? current + delta : delta;
      return { ...prev, [slot]: String(next) };
    });
    if (slot === autoFilledSlot) {
      setAutoFilledSlot(null);
    }
    setClientError(null);
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
  const activePlayers = useMemo(
    () =>
      activeSlots
        .map((slot) => ({ slot, name: players[slot as keyof PlayerSelection] }))
        .filter((entry) => entry.name),
    [activeSlots, players]
  );
  const activePlayerNames = useMemo(() => activePlayers.map((entry) => entry.name), [activePlayers]);

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

    setTobiPlayers((current) => current.filter((player) => playerNames.has(player)));

    if (tobashiPlayer !== NONE_VALUE && !playerNames.has(tobashiPlayer)) {
      setTobashiPlayer(NONE_VALUE);
    }

    if (tobashiPlayer !== NONE_VALUE) {
      setTobiPlayers((current) => current.filter((player) => player !== tobashiPlayer));
    }
  }, [activePlayers, tobashiPlayer]);

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

  useEffect(() => {
    if (!state.success) {
      return;
    }

    resetRoundFields();
  }, [state.success]);

  return (
    <Card className="w-full max-w-3xl border-white/70 bg-white/90 shadow-xl backdrop-blur">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-xl sm:text-2xl">スコア入力</CardTitle>
        <CardDescription>
          3人打ち・4人打ちの最終スコア、飛び、焼き鳥を保存して後日の集計に使える形で記録します。
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
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

            if ((tobiPlayers.length === 0 && tobashiPlayer !== NONE_VALUE) || (tobiPlayers.length > 0 && tobashiPlayer === NONE_VALUE)) {
              e.preventDefault();
              setClientError("飛び対象と飛ばし者は両方セットで選択してください。");
              return;
            }

            if (tobashiPlayer !== NONE_VALUE && tobiPlayers.includes(tobashiPlayer)) {
              e.preventDefault();
              setClientError("飛び対象と飛ばし者に同じプレイヤーは選べません。");
              return;
            }

            setClientError(null);
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div className="space-y-2">
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

              <div className="space-y-2">
                <Label htmlFor="gameDate">対局日</Label>
                <Input id="gameDate" name="gameDate" type="date" defaultValue={today()} required />
              </div>
            </div>

            {activeSlots.map((slot) => (
              <div key={slot} className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 sm:p-4">
                <div>
                  <Label className="mb-2 block text-sm">
                    プレイヤー{slot} <span className="text-destructive">*</span>
                  </Label>
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
                    exclude={activeSlots
                      .filter((s) => s !== slot)
                      .map((s) => players[s as keyof PlayerSelection])
                      .filter(Boolean)}
                    onAddPlayer={handleAddPlayer}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor={`score${slot}`} className="mb-2 block text-sm">
                    スコア <span className="text-destructive">*</span>
                    {autoFilledSlot === slot && (
                      <span className="ml-2 text-xs font-normal text-emerald-600">（自動入力）</span>
                    )}
                  </Label>
                    <div className="relative">
                      <Input
                        id={`score${slot}`}
                        name={`score${slot}`}
                        type="number"
                        step="1"
                        required
                        value={scores[slot] ?? ""}
                        onChange={(e) => handleScoreChange(slot, e.target.value)}
                        onBlur={() => handleScoreBlur(slot)}
                        className={
                          autoFilledSlot === slot
                            ? "border-emerald-300 bg-emerald-50 pr-10 sm:pr-16 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            : "pr-10 sm:pr-16 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        }
                      />
                      {scores[slot] ? (
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
                <label className="flex items-center gap-2">
                  <input
                    name={`yakitori${slot}`}
                    type="checkbox"
                    className="h-4 w-4 rounded border border-input"
                    checked={Boolean(yakitoriSlots[slot])}
                    onChange={(event) =>
                      setYakitoriSlots((current) => ({
                        ...current,
                        [slot]: event.target.checked,
                      }))
                    }
                  />
                  <span className="text-sm font-medium text-emerald-900">焼き鳥</span>
                </label>
              </div>
            ))}

            <div className="space-y-2">
              <Label>飛び対象</Label>
              <div className="space-y-2 rounded-md border border-border/70 bg-white/70 p-3">
                {activePlayers.map((player) => {
                  const checked = tobiPlayers.includes(player.name);
                  const disabled = player.name === tobashiPlayer;
                  return (
                    <label key={`tobi-${player.name}`} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border border-input"
                        checked={checked}
                        disabled={disabled}
                        onChange={(event) => {
                          setTobiPlayers((current) => {
                            if (event.target.checked) {
                              return current.includes(player.name) ? current : [...current, player.name];
                            }
                            return current.filter((name) => name !== player.name);
                          });
                        }}
                      />
                      <span>{player.name}</span>
                    </label>
                  );
                })}
              </div>
              <input type="hidden" name="tobiPlayers" value={tobiPlayers.join(",")} />
            </div>

            <div className="space-y-2">
              <Label>飛ばし者</Label>
                <Select
                  name="tobashiPlayer"
                  value={tobashiPlayer}
                  onValueChange={(value) => {
                    setTobashiPlayer(value);
                    if (value !== NONE_VALUE) {
                      setTobiPlayers((current) => current.filter((name) => name !== value));
                    }
                  }}
                >
                <SelectTrigger>
                  <SelectValue placeholder="なし" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>なし</SelectItem>
                    {activePlayers.map((player) => {
                      const isDisabled = tobiPlayers.includes(player.name) && player.name !== tobashiPlayer;
                      return (
                        <SelectItem key={`tobashi-${player.name}`} value={player.name} disabled={isDisabled}>
                          {player.name}
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <YakumanSelectionPanel
                activePlayerNames={activePlayerNames}
                yakumanOptions={yakumans}
                value={pendingYakumans}
                onChange={setPendingYakumans}
                onErrorChange={setClientError}
              />
              <input type="hidden" name="yakumanSelections" value={JSON.stringify(pendingYakumans)} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">メモ</Label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="flex min-h-24 w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
