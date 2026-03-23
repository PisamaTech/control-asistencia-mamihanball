import { getSessions, Session } from "@/services/sessionService";
import { getAttendanceStats, PlayerStat } from "@/services/reportsService";
import type { Player } from "@/services/playerService";

export type TopPlayer = {
  player: Player;
  percentage: number;
};

export type DashboardStats = {
  lastSession: Session | null;
  teamAveragePercentage: number;
  topPlayers: TopPlayer[];
  recentSessions: Session[];
  activePlayers: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const [sessions, stats] = await Promise.all([
    getSessions(),
    getAttendanceStats({ period: "month", sessionType: "all" }),
  ]);

  const lastSession = sessions[0] ?? null;
  const recentSessions = sessions.slice(0, 3);
  const activePlayers = stats.filter(s => s.player.status === "active").length;

  const teamAveragePercentage =
    stats.length === 0
      ? 0
      : Math.round(
          stats.reduce((sum, s) => sum + s.percentage, 0) / stats.length
        );

  const topPlayers = [...stats]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3)
    .map((s) => ({ player: s.player, percentage: s.percentage }));

  return { lastSession, teamAveragePercentage, topPlayers, recentSessions, activePlayers };
}
