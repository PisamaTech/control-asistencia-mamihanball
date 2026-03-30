import * as faceapi from "face-api.js";
import type { Player } from "@/services/playerService";

const MATCH_THRESHOLD = 0.6;

function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0));
}

const MODELS_PATH = "/models";
let modelsLoaded = false;

export async function loadModels(): Promise<void> {
  if (modelsLoaded) return;
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_PATH),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_PATH),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_PATH),
  ]);
  modelsLoaded = true;
}

export async function getDescriptor(file: File): Promise<number[]> {
  await loadModels();

  // Crear HTMLImageElement en lugar de ImageBitmap
  const img = await createImageElement(file);

  const result = await faceapi
    .detectSingleFace(img)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!result) {
    throw new Error("No se detectó ninguna cara en la imagen");
  }

  return Array.from(result.descriptor);
}

// Helper para crear HTMLImageElement desde File
async function createImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export async function recognizeFaces(
  file: File,
  players: Player[]
): Promise<string[]> {
  await loadModels();

  // Crear HTMLImageElement en lugar de ImageBitmap
  const img = await createImageElement(file);

  const detections = await faceapi
    .detectAllFaces(img)
    .withFaceLandmarks()
    .withFaceDescriptors();

  if (!detections.length) return [];

  const recognized: string[] = [];

  for (const player of players) {
    const descriptors = Object.values(player.faceDescriptors ?? {});
    if (!descriptors.length) continue;

    const matched = detections.some((detected) =>
      descriptors.some(
        (ref) =>
          euclideanDistance(ref, Array.from(detected.descriptor)) <=
          MATCH_THRESHOLD
      )
    );

    if (matched) recognized.push(player.id);
  }

  return recognized;
}
