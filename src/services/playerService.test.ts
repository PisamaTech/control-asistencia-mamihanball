import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPlayers, addPlayer, togglePlayerStatus } from "./playerService";

vi.mock("@/lib/firebase", () => ({ db: {} }));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => ({ id: "mock-collection-ref" })),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  doc: vi.fn(() => ({ id: "mock-doc-ref" })),
  updateDoc: vi.fn(),
  serverTimestamp: vi.fn(() => "mock-timestamp"),
}));

import { getDocs, addDoc, updateDoc } from "firebase/firestore";

const mockGetDocs = vi.mocked(getDocs);
const mockAddDoc = vi.mocked(addDoc);
const mockUpdateDoc = vi.mocked(updateDoc);

beforeEach(() => vi.clearAllMocks());

describe("getPlayers", () => {
  it("returns players from Firestore", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        {
          id: "player-1",
          data: () => ({
            firstName: "Ana",
            lastName: "García",
            status: "active",
            referencePhotoURLs: [],
            faceDescriptors: [],
            createdAt: null,
          }),
        },
        {
          id: "player-2",
          data: () => ({
            firstName: "Laura",
            lastName: "López",
            status: "inactive",
            referencePhotoURLs: [],
            faceDescriptors: [],
            createdAt: null,
          }),
        },
      ],
    } as never);

    const players = await getPlayers();

    expect(players).toHaveLength(2);
    expect(players[0]).toMatchObject({ id: "player-1", firstName: "Ana", lastName: "García" });
    expect(players[1]).toMatchObject({ id: "player-2", firstName: "Laura", status: "inactive" });
  });
});

describe("addPlayer", () => {
  it("saves a player document with the correct fields", async () => {
    mockAddDoc.mockResolvedValue({ id: "new-player-id" } as never);

    const id = await addPlayer({ firstName: "Sofía", lastName: "Martínez" });

    expect(mockAddDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        firstName: "Sofía",
        lastName: "Martínez",
        status: "active",
        referencePhotoURLs: [],
        faceDescriptors: [],
      })
    );
    expect(id).toBe("new-player-id");
  });
});

describe("togglePlayerStatus", () => {
  it("changes status from active to inactive", async () => {
    mockUpdateDoc.mockResolvedValue(undefined);

    await togglePlayerStatus("player-1", "active");

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: "inactive" })
    );
  });

  it("changes status from inactive to active", async () => {
    mockUpdateDoc.mockResolvedValue(undefined);

    await togglePlayerStatus("player-1", "inactive");

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: "active" })
    );
  });
});
