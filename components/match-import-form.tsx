"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { confirmMatchImportAction, previewMatchImportAction, type ImportPreviewRow } from "@/app/match-import-actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TournamentOption } from "@/lib/tournaments";
import type { MatchImportConfirmState, MatchImportPreviewState } from "@/app/match-import-actions";

type MatchImportFormProps = {
  tournaments: TournamentOption[];
};

const PREVIEW_INITIAL: MatchImportPreviewState = { success: false, message: "" };
const CONFIRM_INITIAL: MatchImportConfirmState = { success: false, message: "" };

export function MatchImportForm({ tournaments }: MatchImportFormProps) {
  const [previewState, previewAction, previewPending] = useActionState(previewMatchImportAction, PREVIEW_INITIAL);
  const [confirmState, confirmAction, confirmPending] = useActionState(confirmMatchImportAction, CONFIRM_INITIAL);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(new Set());

  const previewRows = useMemo(() => previewState.rows ?? [], [previewState.rows]);

  useEffect(() => {
    if (!previewState.success || previewRows.length === 0) {
      setSelectedRowIds(new Set());
      return;
    }

    const readyIds = previewRows.filter((row) => row.ready).map((row) => row.rowId);
    setSelectedRowIds(new Set(readyIds));
  }, [previewState.success, previewRows]);

  const selectedRowIdsCsv = useMemo(() => Array.from(selectedRowIds).sort((a, b) => a - b).join(","), [selectedRowIds]);

  function toggleRow(rowId: number) {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
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
          Google スプレッドシート URL を指定してプレビューを作成し、行単位で取り込みを確定します。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form action={previewAction} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="sheetUrl">Google スプレッドシート URL</Label>
              <Input id="sheetUrl" name="sheetUrl" placeholder="https://docs.google.com/spreadsheets/d/..." required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sheetTitle">シート名（任意）</Label>
              <Input id="sheetTitle" name="sheetTitle" placeholder="大会名・開催日" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gameDate">対局日（任意）</Label>
              <Input id="gameDate" name="gameDate" type="date" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tournamentId">大会</Label>
              <select
                id="tournamentId"
                name="tournamentId"
                required
                defaultValue={tournaments[0] ? String(tournaments[0].id) : ""}
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
          <Alert className={previewState.success ? "" : "border-destructive/50 text-destructive"}>
            <AlertDescription>{previewState.message}</AlertDescription>
          </Alert>
        ) : null}

        {previewState.warnings && previewState.warnings.length > 0 ? (
          <Alert>
            <AlertDescription>
              <p className="mb-2 font-semibold">解析時の警告</p>
              <ul className="list-disc pl-5">
                {previewState.warnings.map((warning, index) => (
                  <li key={`${warning}-${index}`}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        ) : null}

        {previewRows.length > 0 ? (
          <form action={confirmAction} className="space-y-4">
            <input type="hidden" name="payloadJson" value={previewState.payloadJson ?? ""} />
            <input type="hidden" name="selectedRowIds" value={selectedRowIdsCsv} />

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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Button type="submit" disabled={confirmPending || selectedRowIds.size === 0}>
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
