import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAttendanceStats } from "./reportsService";

vi.mock("@/lib/firebase", () => ({ db: {} }));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => ({ id: "mock-col" })),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  Timestamp: { fromDate: vi.fn((d) => d) },
}));

import { getDocs } from "firebase/firestore";
const mockGetDocs = vi.mocked(getDocs);

beforeEach(() => vi.clearAllMocks());

const makeAttendanceDoc = (playerId: string, attended: boolean, type: "practice" | "game") => ({
  data: () => ({ playerId, attended, sessionType: type }),
});

const makePlayerDoc = (id: string, name: string) => ({
  id,
  data: () => ({
    firstName: name,
    lastName: "Test",
    status: "active",
    referencePhotoURLs: [],
    faceDescriptors: [],
    createdAt: null,
  }),
});

describe("getAttendanceStats", () => {
  it("includes players with zero attendance in the results", async () => {
    mockGetDocs
      .mockResolvedValueOnce({ docs: [] } as never)           // attendance: ninguna
      .mockResolvedValueOnce({                                  // players: 2 jugadoras
        docs: [makePlayerDoc("p1", "Ana"), makePlayerDoc("p2", "Laura")],
      } as never);

    const stats = await getAttendanceStats({ period: "month", sessionType: "all" });

    expect(stats).toHaveLength(2);
    expect(stats.find((s) => s.player.id === "p1")?.totalAttended).toBe(0);
    expect(stats.find((s) => s.player.id === "p2")?.totalAttended).toBe(0);
  });

  it("calculates attendance percentage correctly", async () => {
    mockGetDocs
      .mockResolvedValueOnce({
        docs: [
          makeAttendanceDoc("p1", true, "practice"),
          makeAttendanceDoc("p1", true, "practice"),
          makeAttendanceDoc("p1", false, "practice"),
          makeAttendanceDoc("p1", false, "practice"),
        ],
      } as never)
      .mockResolvedValueOnce({
        docs: [makePlayerDoc("p1", "Ana")],
      } as never);

    const stats = await getAttendanceStats({ period: "month", sessionType: "all" });

    expect(stats[0].totalAttended).toBe(2);
    expect(stats[0].totalSessions).toBe(4);
    expect(stats[0].percentage).toBe(50);
  });

  it("splits practices and games attended correctly", async () => {
    mockGetDocs
      .mockResolvedValueOnce({
        docs: [
          makeAttendanceDoc("p1", true, "practice"),
          makeAttendanceDoc("p1", true, "practice"),
          makeAttendanceDoc("p1", true, "game"),
          makeAttendanceDoc("p1", false, "game"),
        ],
      } as never)
      .mockResolvedValueOnce({
        docs: [makePlayerDoc("p1", "Ana")],
      } as never);

    const stats = await getAttendanceStats({ period: "month", sessionType: "all" });

    expect(stats[0].practicesAttended).toBe(2);
    expect(stats[0].gamesAttended).toBe(1);
  });
});
