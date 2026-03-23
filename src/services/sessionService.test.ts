import { describe, it, expect, vi, beforeEach } from "vitest";
import { addSession, getSessions, getSessionDetail } from "./sessionService";

vi.mock("@/lib/firebase", () => ({ db: {} }));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => ({ id: "mock-col" })),
  doc: vi.fn(() => ({ id: "mock-doc" })),
  writeBatch: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  where: vi.fn(),
  serverTimestamp: vi.fn(() => "mock-ts"),
}));

import { writeBatch, doc, getDocs, getDoc } from "firebase/firestore";

const mockWriteBatch = vi.mocked(writeBatch);
const mockDoc = vi.mocked(doc);
const mockGetDocs = vi.mocked(getDocs);
const mockGetDoc = vi.mocked(getDoc);

beforeEach(() => vi.clearAllMocks());

describe("addSession", () => {
  it("writes a session doc and one attendance record per active player", async () => {
    const mockSet = vi.fn();
    const mockCommit = vi.fn().mockResolvedValue(undefined);
    mockWriteBatch.mockReturnValue({ set: mockSet, commit: mockCommit } as never);
    mockDoc.mockReturnValue({ id: "new-session-id" } as never);

    await addSession({
      date: new Date("2026-03-23"),
      type: "practice",
      notes: "",
      photoURL: "https://storage/photo.jpg",
      createdBy: "user-1",
      attendedPlayerIds: ["player-1"],
      manualPlayerIds: [],
      allActivePlayerIds: ["player-1", "player-2"],
    });

    expect(mockSet).toHaveBeenCalledTimes(3);
    expect(mockCommit).toHaveBeenCalledTimes(1);
  });

  it("marks attended players with method 'facial' and manual players with 'manual'", async () => {
    const mockSet = vi.fn();
    const mockCommit = vi.fn().mockResolvedValue(undefined);
    mockWriteBatch.mockReturnValue({ set: mockSet, commit: mockCommit } as never);
    mockDoc.mockReturnValue({ id: "new-session-id" } as never);

    await addSession({
      date: new Date("2026-03-23"),
      type: "practice",
      notes: "",
      photoURL: "https://storage/photo.jpg",
      createdBy: "user-1",
      attendedPlayerIds: ["player-1"],
      manualPlayerIds: ["player-2"],
      allActivePlayerIds: ["player-1", "player-2"],
    });

    const attendanceCalls = mockSet.mock.calls.slice(1);
    const player1Record = attendanceCalls.find((c) =>
      JSON.stringify(c[1]).includes("player-1")
    )?.[1];
    const player2Record = attendanceCalls.find((c) =>
      JSON.stringify(c[1]).includes("player-2")
    )?.[1];

    expect(player1Record).toMatchObject({ attended: true, method: "facial" });
    expect(player2Record).toMatchObject({ attended: true, method: "manual" });
  });
});

describe("getSessions", () => {
  it("returns sessions ordered by date descending", async () => {
    const older = new Date("2026-03-01");
    const newer = new Date("2026-03-20");

    mockGetDocs.mockResolvedValue({
      docs: [
        { id: "s1", data: () => ({ date: { toDate: () => newer }, type: "practice", notes: "", photoURL: "", createdBy: "u1", createdAt: null }) },
        { id: "s2", data: () => ({ date: { toDate: () => older }, type: "game", notes: "", photoURL: "", createdBy: "u1", createdAt: null }) },
      ],
    } as never);

    const sessions = await getSessions();

    expect(sessions[0].id).toBe("s1");
    expect(sessions[1].id).toBe("s2");
    expect(sessions[0].date.getTime()).toBeGreaterThan(sessions[1].date.getTime());
  });
});

describe("getSessionDetail", () => {
  it("returns null when session does not exist", async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false } as never);

    const result = await getSessionDetail("nonexistent-id");

    expect(result).toBeNull();
  });

  it("classifies attended and absent players correctly", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: "session-1",
      data: () => ({
        date: { toDate: () => new Date("2026-03-23") },
        type: "practice",
        notes: "",
        photoURL: "",
        createdBy: "u1",
        createdAt: null,
      }),
    } as never);

    mockGetDocs.mockResolvedValueOnce({
      docs: [
        { id: "att-1", data: () => ({ playerId: "p1", attended: true, method: "facial" }) },
        { id: "att-2", data: () => ({ playerId: "p2", attended: false, method: "none" }) },
      ],
    } as never).mockResolvedValueOnce({
      docs: [
        { id: "p1", data: () => ({ firstName: "Ana", lastName: "García", status: "active", referencePhotoURLs: [], faceDescriptors: [], createdAt: null }) },
        { id: "p2", data: () => ({ firstName: "Laura", lastName: "López", status: "active", referencePhotoURLs: [], faceDescriptors: [], createdAt: null }) },
      ],
    } as never);

    const result = await getSessionDetail("session-1");

    expect(result).not.toBeNull();
    expect(result!.attended).toHaveLength(1);
    expect(result!.attended[0].player.id).toBe("p1");
    expect(result!.attended[0].method).toBe("facial");
    expect(result!.absent).toHaveLength(1);
    expect(result!.absent[0].id).toBe("p2");
  });
});
