import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Player } from "./playerService";

export type ReportPeriod = "week" | "month" | "3months";
export type ReportSessionType = "practice" | "game" | "all";

export type ReportFilters = {
  period: ReportPeriod;
  sessionType: ReportSessionType;
};

export type PlayerStat = {
  player: Player;
  totalAttended: number;
  totalSessions: number;
  percentage: number;
  practicesAttended: number;
  gamesAttended: number;
};

function getPeriodStart(period: ReportPeriod): Date {
  const now = new Date();
  if (period === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (period === "month") {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    return d;
  }
  const d = new Date(now);
  d.setMonth(d.getMonth() - 3);
  return d;
}

export async function getAttendanceStats(
  filters: ReportFilters
): Promise<PlayerStat[]> {
  const periodStart = getPeriodStart(filters.period);

  // Build attendance query
  const constraints = [
    where("sessionDate", ">=", Timestamp.fromDate(periodStart)),
  ];
  if (filters.sessionType !== "all") {
    constraints.push(where("sessionType", "==", filters.sessionType));
  }

  const attendanceSnap = await getDocs(
    query(collection(db, "attendance"), ...constraints)
  );
  const playersSnap = await getDocs(collection(db, "players"));

  const players = playersSnap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Player))
    .filter((p) => p.status === "active");

  // Aggregate per player
  type Agg = { attended: number; practices: number; games: number; total: number };
  const agg = new Map<string, Agg>();
  players.forEach((p) => agg.set(p.id, { attended: 0, practices: 0, games: 0, total: 0 }));

  for (const doc of attendanceSnap.docs) {
    const { playerId, attended, sessionType } = doc.data();
    const entry = agg.get(playerId);
    if (!entry) continue;

    entry.total += 1;
    if (attended) {
      entry.attended += 1;
      if (sessionType === "practice") entry.practices += 1;
      if (sessionType === "game") entry.games += 1;
    }
  }

  return players.map((player) => {
    const { attended, practices, games, total } = agg.get(player.id)!;
    return {
      player,
      totalAttended: attended,
      totalSessions: total,
      percentage: total === 0 ? 0 : Math.round((attended / total) * 100),
      practicesAttended: practices,
      gamesAttended: games,
    };
  });
}
