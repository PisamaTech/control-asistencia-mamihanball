import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDescriptor, recognizeFaces } from "./faceRecognition";
import type { Player } from "@/services/playerService";

// Mock face-api.js
vi.mock("face-api.js", () => ({
  nets: {
    ssdMobilenetv1: { loadFromUri: vi.fn().mockResolvedValue(undefined) },
    faceLandmark68Net: { loadFromUri: vi.fn().mockResolvedValue(undefined) },
    faceRecognitionNet: { loadFromUri: vi.fn().mockResolvedValue(undefined) },
  },
  detectSingleFace: vi.fn(),
  detectAllFaces: vi.fn(),
  env: { monkeyPatch: vi.fn() },
}));

global.createImageBitmap = vi.fn().mockResolvedValue({} as ImageBitmap);

import * as faceapi from "face-api.js";

const mockDetectSingleFace = vi.mocked(faceapi.detectSingleFace);
const mockDetectAllFaces = vi.mocked(faceapi.detectAllFaces);

beforeEach(() => vi.clearAllMocks());

// Helper: descriptor muy cercano a otro (distancia ~0, hace match)
const closeDescriptor = new Array(128).fill(0);
// Helper: descriptor muy lejano (distancia ~11, no hace match)
const farDescriptor = new Array(128).fill(1);

function makePlayer(id: string, descriptors: number[][]): Player {
  const faceDescriptors: Record<string, number[]> = {};
  descriptors.forEach((d, i) => { faceDescriptors[String(i)] = d; });
  return {
    id,
    firstName: "Test",
    lastName: "Player",
    status: "active",
    referencePhotoURLs: [],
    faceDescriptors,
    createdAt: null,
  };
}

describe("getDescriptor", () => {
  it("returns a number array when a face is detected", async () => {
    const mockDescriptor = new Float32Array(128).fill(0.5);

    mockDetectSingleFace.mockReturnValue({
      withFaceLandmarks: () => ({
        withFaceDescriptor: () => Promise.resolve({ descriptor: mockDescriptor }),
      }),
    } as never);

    const file = new File(["fake-image"], "photo.jpg", { type: "image/jpeg" });
    const result = await getDescriptor(file);

    expect(result).toHaveLength(128);
    expect(Array.isArray(result)).toBe(true);
  });

  it("throws when no face is detected in the image", async () => {
    mockDetectSingleFace.mockReturnValue({
      withFaceLandmarks: () => ({
        withFaceDescriptor: () => Promise.resolve(undefined),
      }),
    } as never);

    const file = new File(["fake-image"], "photo.jpg", { type: "image/jpeg" });

    await expect(getDescriptor(file)).rejects.toThrow(
      "No se detectó ninguna cara en la imagen"
    );
  });
});

describe("recognizeFaces", () => {
  it("returns player IDs whose descriptors match detected faces", async () => {
    const detectedDescriptor = new Float32Array(closeDescriptor);

    mockDetectAllFaces.mockReturnValue({
      withFaceLandmarks: () => ({
        withFaceDescriptors: () =>
          Promise.resolve([{ descriptor: detectedDescriptor }]),
      }),
    } as never);

    const players = [
      makePlayer("player-1", [closeDescriptor]),  // debe hacer match
      makePlayer("player-2", [farDescriptor]),     // no debe hacer match
    ];

    const file = new File(["fake"], "group.jpg", { type: "image/jpeg" });
    const result = await recognizeFaces(file, players);

    expect(result).toContain("player-1");
    expect(result).not.toContain("player-2");
  });

  it("returns empty array when no faces are detected", async () => {
    mockDetectAllFaces.mockReturnValue({
      withFaceLandmarks: () => ({
        withFaceDescriptors: () => Promise.resolve([]),
      }),
    } as never);

    const players = [makePlayer("player-1", [closeDescriptor])];
    const file = new File(["fake"], "group.jpg", { type: "image/jpeg" });
    const result = await recognizeFaces(file, players);

    expect(result).toHaveLength(0);
  });

  it("does not match players with no stored descriptors", async () => {
    const detectedDescriptor = new Float32Array(closeDescriptor);

    mockDetectAllFaces.mockReturnValue({
      withFaceLandmarks: () => ({
        withFaceDescriptors: () =>
          Promise.resolve([{ descriptor: detectedDescriptor }]),
      }),
    } as never);

    const players = [makePlayer("player-1", [])]; // sin descriptores
    const file = new File(["fake"], "group.jpg", { type: "image/jpeg" });
    const result = await recognizeFaces(file, players);

    expect(result).toHaveLength(0);
  });
});
