"use client";

import type { MatchImportConfirmState, MatchImportPreviewState } from "@/app/match-import-actions";
import { confirmMatchImportAction, previewMatchImportAction, type ImportPreviewRow } from "@/app/match-import-actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TournamentOption } from "@/lib/tournaments";
import { usePathname, useSearchParams } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";

type MatchImportFormProps = {
  tournaments: TournamentOption[];
};

const PREVIEW_INITIAL: MatchImportPreviewState = { success: false, message: "" };
const CONFIRM_INITIAL: MatchImportConfirmState = { success: false, message: "" };

export function MatchImportForm({ tournaments }: MatchImportFormProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [sheetTitleValue, setSheetTitleValue] = useState(() => searchParams.get("sheetTitle") ?? "");
  const [gameDateValue, setGameDateValue] = useState(() => searchParams.get("gameDate") ?? "");
  const [tournamentIdValue, setTournamentIdValue] = useState(
    () => searchParams.get("tournamentId") ?? (tournaments[0] ? String(tournaments[0].id) : "")
  );

  const updateQueryParams = (sheetTitle: string, gameDate: string, tournamentId: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (sheetTitle) params.set("sheetTitle", sheetTitle);
    else params.delete("sheetTitle");

    if (gameDate) params.set("gameDate", gameDate);
    else params.delete("gameDate");

    if (tournamentId) params.set("tournamentId", tournamentId);
    else params.delete("tournamentId");

    const next = params.toString();
    const nextUrl = next ? `${pathname}?${next}` : pathname;
    window.history.replaceState(null, "", nextUrl);
  };

  const [previewState, previewAction, previewPending] = useActionState(previewMatchImportAction, PREVIEW_INITIAL);
  const [confirmState, confirmAction, confirmPending] = useActionState(confirmMatchImportAction, CONFIRM_INITIAL);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(new Set());
  const [conflictResolutionMap, setConflictResolutionMap] = useState<Record<string, "tobi" | "tobashi">>({});

  const previewRows = useMemo(() => previewState.rows ?? [], [previewState.rows]);

  useEffect(() => {
    if (!previewState.success || previewRows.length === 0) {
      setSelectedRowIds(new Set());
      setConflictResolutionMap({});
      return;
    }

    const readyIds = previewRows.filter((row) => row.ready).map((row) => row.rowId);
    setSelectedRowIds(new Set(readyIds));
  }, [previewState.success, previewRows]);

  const selectedRowIdsCsv = useMemo(() => Array.from(selectedRowIds).sort((a, b) => a - b).join(","), [selectedRowIds]);
  const conflictResolutionJson = useMemo(() => JSON.stringify(conflictResolutionMap), [conflictResolutionMap]);
  const unresolvedConflictCount = useMemo(() => {
    let count = 0;
    for (const row of previewRows) {
      if (!selectedRowIds.has(row.rowId)) continue;
      for (const playerName of row.conflictingFlagPlayers) {
        const key = `${row.rowId}:${playerName}`;
        if (!conflictResolutionMap[key]) count += 1;
      }
    }
    return count;
  }, [conflictResolutionMap, previewRows, selectedRowIds]);

  function toggleRow(rowId: number) {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  }

  function setConflictResolution(rowId: number, playerName: string, value: "tobi" | "tobashi" | "") {
    const key = `${rowId}:${playerName}`;
    setConflictResolutionMap((prev) => {
      if (!value) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return {
        ...prev,
        [key]: value,
      };
    });
  }

  function renderIssue(row: ImportPreviewRow): string {
    if (row.issues.length === 0) return "";
    return row.issues.join(" / ");
  }

  return (
    <Card className="border-white/70 bg-white/90 shadow-xl backdrop-blur">
      <CardHeader>
        <CardTitle>スプレッドシート一括インポート（PoC）</CardTitle>
        <CardDescription>
          設定済みの Google スプレッドシートからプレビューを作成し、行単位で取り込みを確定します。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          action={previewAction}
          className="space-y-4"
          onSubmit={() => {
            updateQueryParams(sheetTitleValue, gameDateValue, tournamentIdValue);
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sheetTitle">シート名（任意）</Label>
              <Input
                id="sheetTitle"
                name="sheetTitle"
                placeholder="大会名・開催日"
                value={sheetTitleValue}
                onChange={(event) => setSheetTitleValue(event.target.value)}
                onBlur={() => updateQueryParams(sheetTitleValue, gameDateValue, tournamentIdValue)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gameDate">対局日（任意）</Label>
              <Input
                id="gameDate"
                name="gameDate"
                type="date"
                value={gameDateValue}
                onChange={(event) => setGameDateValue(event.target.value)}
                onBlur={() => updateQueryParams(sheetTitleValue, gameDateValue, tournamentIdValue)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="tournamentId">大会</Label>
              <select
                id="tournamentId"
                name="tournamentId"
                required
                value={tournamentIdValue}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setTournamentIdValue(nextValue);
                  updateQueryParams(sheetTitleValue, gameDateValue, nextValue);
                }}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {tournaments.map((tournament) => (
                  <option key={tournament.id} value={tournament.id}>
                    {tournament.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button type="submit" disabled={previewPending}>
            {previewPending ? "プレビュー作成中..." : "プレビュー作成"}
          </Button>
        </form>

        {previewState.message ? (
          <Alert className={previewState.success ? "border-emerald-100 bg-emerald-50" : "border-destructive/50 bg-destructive/5 text-destructive"}>
            <AlertDescription>{previewState.message}</AlertDescription>
          </Alert>
        ) : null}

        {previewState.warnings && previewState.warnings.length > 0 ? (
          <Alert className="border-amber-100 bg-amber-50">
            <div className="leading-relaxed">
              <p className="mb-2 font-semibold text-amber-900">解析時の警告</p>
              <ul className="ml-4 space-y-1 text-sm text-amber-800">
                {previewState.warnings.map((warning, index) => (
                  <li key={`${warning}-${index}`} className="list-disc">
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          </Alert>
        ) : null}

        {previewRows.length > 0 ? (
          <form action={confirmAction} className="space-y-4">
            <input type="hidden" name="payloadJson" value={previewState.payloadJson ?? ""} />
            <input type="hidden" name="selectedRowIds" value={selectedRowIdsCsv} />
            <input type="hidden" name="conflictResolutionJson" value={conflictResolutionJson} />

            <div className="rounded-md border border-emerald-100">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-emerald-50 text-emerald-900">
                    <tr>
                      <th className="px-3 py-2 text-left">取込</th>
                      <th className="px-3 py-2 text-left">試合</th>
                      <th className="px-3 py-2 text-left">形式</th>
                      <th className="px-3 py-2 text-left">プレーヤー</th>
                      <th className="px-3 py-2 text-left">合計</th>
                      <th className="px-3 py-2 text-left">状態</th>
                      <th className="px-3 py-2 text-left">取込不可理由</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row) => (
                      <tr key={row.rowId} className="border-t border-emerald-100 align-top">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedRowIds.has(row.rowId)}
                            disabled={!row.ready || confirmPending}
                            onChange={() => toggleRow(row.rowId)}
                          />
                        </td>
                        <td className="px-3 py-2">#{row.gameNo}</td>
                        <td className="px-3 py-2">{row.gameType.toUpperCase()}</td>
                        <td className="px-3 py-2">
                          <div className="space-y-1">
                            {row.players.map((player, idx) => (
                              <div key={`${row.rowId}-${player}-${idx}`}>
                                <span>{player}</span>
                                {row.matchedPlayers[idx] && row.matchedPlayers[idx] !== player ? (
                                  <span className="ml-2 text-xs text-emerald-700">→ {row.matchedPlayers[idx]}</span>
                                ) : null}
                                {row.fuzzyCandidates[player]?.length ? (
                                  <p className="text-xs text-amber-700">候補: {row.fuzzyCandidates[player].join(", ")}</p>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className={`px-3 py-2 ${row.total === 0 ? "text-emerald-700" : "text-destructive"}`}>{row.total}</td>
                        <td className="px-3 py-2">
                          {row.ready ? (
                            <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-900">取込可能</span>
                          ) : (
                            <span className="rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">要確認</span>
                          )}
                          {!row.ready && row.issues.length > 0 ? <p className="mt-1 text-xs text-amber-800">{renderIssue(row)}</p> : null}
                          {row.conflictingFlagPlayers.length > 0 ? (
                            <div className="mt-2 space-y-2">
                              {row.conflictingFlagPlayers.map((playerName) => {
                                const key = `${row.rowId}:${playerName}`;
                                const value = conflictResolutionMap[key] ?? "";
                                return (
                                  <div key={key} className="text-xs">
                                    <p className="mb-1 text-amber-800">{playerName}: 飛び/飛ばしが競合しています</p>
                                    <select
                                      className="h-8 w-full rounded border border-input bg-background px-2"
                                      value={value}
                                      onChange={(event) => {
                                        const selected = event.target.value;
                                        if (selected === "tobi" || selected === "tobashi") {
                                          setConflictResolution(row.rowId, playerName, selected);
                                        } else {
                                          setConflictResolution(row.rowId, playerName, "");
                                        }
                                      }}
                                      disabled={confirmPending}
                                    >
                                      <option value="">選択してください</option>
                                      <option value="tobi">飛び（TB）を残す</option>
                                      <option value="tobashi">飛ばし（T）を残す</option>
                                    </select>
                                  </div>
                                );
                              })}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-3 py-2">
                          {row.ready ? (
                            <span className="text-xs text-muted-foreground">-</span>
                          ) : (
                            <div className="space-y-1 text-xs">
                              {row.issuesByColumn.player.map((issue, idx) => (
                                <p key={`player-${row.rowId}-${idx}`} className="text-amber-800">プレーヤー列: {issue}</p>
                              ))}
                              {row.issuesByColumn.score.map((issue, idx) => (
                                <p key={`score-${row.rowId}-${idx}`} className="text-amber-800">合計列: {issue}</p>
                              ))}
                              {row.issuesByColumn.flags.map((issue, idx) => (
                                <p key={`flags-${row.rowId}-${idx}`} className="text-amber-800">飛び/飛ばし列: {issue}</p>
                              ))}
                              {row.issuesByColumn.duplicate.map((issue, idx) => (
                                <p key={`dup-${row.rowId}-${idx}`} className="text-amber-800">重複判定: {issue}</p>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {unresolvedConflictCount > 0 ? (
              <Alert className="border-amber-300 text-amber-900">
                <AlertDescription>
                  競合している飛び/飛ばしの解決が {unresolvedConflictCount} 件残っています。解決後にインポートしてください。
                </AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" disabled={confirmPending || selectedRowIds.size === 0 || unresolvedConflictCount > 0}>
              {confirmPending ? "インポート中..." : `選択行をインポート (${selectedRowIds.size})`}
            </Button>
          </form>
        ) : null}

        {confirmState.message ? (
          <Alert className={confirmState.success ? "" : "border-destructive/50 text-destructive"}>
            <AlertDescription>{confirmState.message}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
