import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getSessions, Session } from "@/services/sessionService";
import { getAttendanceStats } from "@/services/reportsService";
import type { Player } from "@/services/playerService";

export type TopPlayer = {
  player: Player;
  percentage: number;
};

export type SessionWithStats = Session & {
  presentCount: number;
  totalPlayers: number;
};

export type DashboardStats = {
  lastSession: Session | null;
  teamAveragePercentage: number;
  topPlayers: TopPlayer[];
  recentSessions: SessionWithStats[];
  activePlayers: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const [sessions, stats] = await Promise.all([
    getSessions(),
    getAttendanceStats({ period: "month", sessionType: "all" }),
  ]);

  const lastSession = sessions[0] ?? null;
  const recent = sessions.slice(0, 3);
  const activePlayers = stats.filter((s) => s.player.status === "active").length;

  const teamAveragePercentage =
    stats.length === 0
      ? 0
      : Math.round(stats.reduce((sum, s) => sum + s.percentage, 0) / stats.length);

  const topPlayers = [...stats]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3)
    .map((s) => ({ player: s.player, percentage: s.percentage }));

  // Obtener conteos de asistencia para las sesiones recientes
  let recentSessions: SessionWithStats[] = recent.map((s) => ({
    ...s,
    presentCount: 0,
    totalPlayers: 0,
  }));

  if (recent.length > 0) {
    const recentIds = recent.map((s) => s.id);
    const attendanceSnap = await getDocs(
      query(collection(db, "attendance"), where("sessionId", "in", recentIds)),
    );

    const countMap = new Map<string, { present: number; total: number }>(
      recentIds.map((id) => [id, { present: 0, total: 0 }]),
    );

    for (const doc of attendanceSnap.docs) {
      const { sessionId, attended } = doc.data();
      const counts = countMap.get(sessionId);
      if (counts) {
        counts.total++;
        if (attended) counts.present++;
      }
    }

    recentSessions = recent.map((s) => ({
      ...s,
      presentCount: countMap.get(s.id)?.present ?? 0,
      totalPlayers: countMap.get(s.id)?.total ?? 0,
    }));
  }

  return { lastSession, teamAveragePercentage, topPlayers, recentSessions, activePlayers };
}
