"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type YakumanOption = {
  code: string;
  name: string;
  points?: number | null;
};

export type YakumanSelectionEntry = {
  playerName: string;
  yakumanCode: string;
  yakumanName: string;
  points?: number | null;
};

type YakumanSelectionPanelProps = {
  activePlayerNames: string[];
  yakumanOptions: YakumanOption[];
  value: YakumanSelectionEntry[];
  onChange: (next: YakumanSelectionEntry[]) => void;
  onErrorChange?: (message: string | null) => void;
  noteText?: string;
  className?: string;
};

export function YakumanSelectionPanel({
  activePlayerNames,
  yakumanOptions,
  value,
  onChange,
  onErrorChange,
  noteText,
  className,
}: YakumanSelectionPanelProps) {
  const [selectedYakumanPlayer, setSelectedYakumanPlayer] = useState("");
  const [selectedYakumanCode, setSelectedYakumanCode] = useState("");

  useEffect(() => {
    if (selectedYakumanPlayer && !activePlayerNames.includes(selectedYakumanPlayer)) {
      setSelectedYakumanPlayer("");
    }

    const filtered = value.filter((entry) => activePlayerNames.includes(entry.playerName));
    if (filtered.length !== value.length) {
      onChange(filtered);
    }
  }, [activePlayerNames, onChange, selectedYakumanPlayer, value]);

  function addSelection() {
    if (!selectedYakumanPlayer) {
      onErrorChange?.("役満の対象プレイヤーを選択してください。");
      return;
    }

    if (!selectedYakumanCode) {
      onErrorChange?.("役満を選択してください。");
      return;
    }

    const found = yakumanOptions.find((y) => y.code === selectedYakumanCode);
    if (!found) {
      onErrorChange?.("役満の選択が不正です。");
      return;
    }

    onChange([
      ...value,
      {
        playerName: selectedYakumanPlayer,
        yakumanCode: found.code,
        yakumanName: found.name,
        points: found.points ?? null,
      },
    ]);
    setSelectedYakumanCode("");
    onErrorChange?.(null);
  }

  function removeSelection(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className={className ?? "space-y-2"}>
      <Label>役満情報</Label>
      <div className="space-y-3 rounded-md border border-border/70 bg-white/70 p-3 sm:p-4">
        <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
          <Select value={selectedYakumanPlayer} onValueChange={setSelectedYakumanPlayer}>
            <SelectTrigger>
              <SelectValue placeholder="プレイヤーを選択" />
            </SelectTrigger>
            <SelectContent>
              {activePlayerNames.map((name) => (
                <SelectItem key={`yakuman-player-${name}`} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYakumanCode} onValueChange={setSelectedYakumanCode}>
            <SelectTrigger>
              <SelectValue placeholder="役満を選択" />
            </SelectTrigger>
            <SelectContent>
              {yakumanOptions.map((y) => (
                <SelectItem key={`yakuman-name-${y.code}`} value={y.code}>
                  {y.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button type="button" variant="outline" onClick={addSelection}>
            登録
          </Button>
        </div>

        {value.length > 0 ? (
          <div className="space-y-2">
            {value.map((entry, index) => (
              <div
                key={`${entry.playerName}-${entry.yakumanCode}-${index}`}
                className="flex items-center justify-between rounded border px-3 py-2 text-sm"
              >
                <span>{entry.playerName} / {entry.yakumanName}</span>
                <Button type="button" size="sm" variant="ghost" onClick={() => removeSelection(index)}>
                  削除
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">登録済みの役満はありません。</p>
        )}

        {noteText ? <div className="text-xs text-emerald-800">{noteText}</div> : null}
      </div>
    </div>
  );
}