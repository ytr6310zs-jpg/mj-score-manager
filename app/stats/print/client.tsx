"use client";

import PrintTrigger from "@/components/print-trigger";
import "./print.css";
import { StatsSummaryTable } from "@/components/stats-print/StatsSummaryTable";
import { ExtraStatsTable } from "@/components/stats-print/ExtraStatsTable";
import { MatchHistoryTable } from "@/components/stats-print/MatchHistoryTable";
import type { MatchResult } from "@/lib/matches";
import type { PlayerStats } from "@/lib/stats";
import type { ScoreRank, SpreadRank, YakumanEvent } from "@/lib/stats-subtables";

type Props = {
  }
  yakumanEvents: YakumanEvent[];
