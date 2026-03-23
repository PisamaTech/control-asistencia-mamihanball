import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDashboardStats } from "./dashboardService";

vi.mock("@/services/reportsService", () => ({
  getAttendanceStats: vi.fn(),
}));

vi.mock("@/services/sessionService", () => ({
  getSessions: vi.fn(),
}));

import { getAttendanceStats } from "@/services/reportsService";
import { getSessions } from "@/services/sessionService";

const mockGetAttendanceStats = vi.mocked(getAttendanceStats);
const mockGetSessions = vi.mocked(getSessions);

beforeEach(() => vi.clearAllMocks());

function makePlayer(id: string, name: string) {
  return { id, firstName: name, lastName: "Test", status: "active" as const, referencePhotoURLs: [], faceDescriptors: [], createdAt: null };
}

function makeStat(playerId: string, name: string, percentage: number) {
  return { player: makePlayer(playerId, name), percentage, totalAttended: 0, totalSessions: 0, practicesAttended: 0, gamesAttended: 0 };
}

describe("getDashboardStats", () => {
  it("returns teamAveragePercentage of 0 when there are no sessions", async () => {
    mockGetSessions.mockResolvedValue([]);
    mockGetAttendanceStats.mockResolvedValue([]);

    const result = await getDashboardStats();

    expect(result.teamAveragePercentage).toBe(0);
    expect(result.lastSession).toBeNull();
  });

  it("calculates team average as the mean of individual percentages", async () => {
    mockGetSessions.mockResolvedValue([
      { id: "s1", date: new Date(), type: "practice", notes: "", photoURL: "", createdBy: "u1", createdAt: null },
    ] as never);
    mockGetAttendanceStats.mockResolvedValue([
      makeStat("p1", "Ana", 100),
      makeStat("p2", "Laura", 50),
      makeStat("p3", "Sofia", 0),
    ]);

    const result = await getDashboardStats();

    expect(result.teamAveragePercentage).toBe(50); // (100+50+0)/3
  });

  it("returns top 3 players sorted by percentage descending", async () => {
    mockGetSessions.mockResolvedValue([
      { id: "s1", date: new Date(), type: "practice", notes: "", photoURL: "", createdBy: "u1", createdAt: null },
    ] as never);
    mockGetAttendanceStats.mockResolvedValue([
      makeStat("p1", "Ana", 80),
      makeStat("p2", "Laura", 100),
      makeStat("p3", "Sofia", 60),
      makeStat("p4", "Maria", 90),
    ]);

    const result = await getDashboardStats();

    expect(result.topPlayers).toHaveLength(3);
    expect(result.topPlayers[0].player.id).toBe("p2"); // 100%
    expect(result.topPlayers[1].player.id).toBe("p4"); // 90%
    expect(result.topPlayers[2].player.id).toBe("p1"); // 80%
  });
});
