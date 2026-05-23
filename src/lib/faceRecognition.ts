import * as faceapi from "face-api.js";
import type { Player } from "@/services/playerService";

const MATCH_THRESHOLD = 0.55;
const DETECTION_CONFIDENCE = 0.6;

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

async function createImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FaceMatch {
  /** ID de la jugadora matcheada, o null si no se reconoció */
  playerId: string | null;
  /** Nombre completo de la jugadora, o null */
  playerName: string | null;
  /** Coordenadas del bounding box en píxeles (relativas a la imagen original) */
  box: FaceBox;
  /** Distancia euclídea mínima, o null si no hubo match */
  distance: number | null;
}

export interface RecognitionResult {
  matches: FaceMatch[];
  imageWidth: number;
  imageHeight: number;
}

/**
 * Reconoce jugadoras en una foto grupal.
 *
 * Mejoras respecto a la versión anterior:
 * - Asignación única: cada cara detectada se asigna a la jugadora más cercana,
 *   y cada jugadora solo puede ser asignada una vez.
 * - Devuelve coordenadas de cada cara para mostrarlas en la UI.
 */
export async function recognizeFaces(
  file: File,
  players: Player[],
): Promise<RecognitionResult> {
  await loadModels();

  const img = await createImageElement(file);
  const imageWidth = img.naturalWidth;
  const imageHeight = img.naturalHeight;

  const detections = await faceapi
    .detectAllFaces(
      img,
      new faceapi.SsdMobilenetv1Options({
        minConfidence: DETECTION_CONFIDENCE,
      }),
    )
    .withFaceLandmarks()
    .withFaceDescriptors();

  // Inicializar resultado: una entrada por detección, todas sin match
  const matches: FaceMatch[] = detections.map((d) => ({
    playerId: null,
    playerName: null,
    box: {
      x: Math.round(d.box.x),
      y: Math.round(d.box.y),
      width: Math.round(d.box.width),
      height: Math.round(d.box.height),
    },
    distance: null,
  }));

  if (!detections.length) {
    return { matches, imageWidth, imageHeight };
  }

  // Para cada detección, calcular distancia a cada jugadora
  interface Candidate {
    detectionIndex: number;
    playerId: string;
    distance: number;
  }

  const candidates: Candidate[] = [];

  for (let di = 0; di < detections.length; di++) {
    const detectedDescriptor = Array.from(detections[di].descriptor);

    for (const player of players) {
      const playerDescriptors = Object.values(player.faceDescriptors ?? {});
      if (!playerDescriptors.length) continue;

      const minDist = Math.min(
        ...playerDescriptors.map((ref) =>
          euclideanDistance(ref, detectedDescriptor),
        ),
      );

      if (minDist <= MATCH_THRESHOLD) {
        candidates.push({
          detectionIndex: di,
          playerId: player.id,
          distance: minDist,
        });
      }
    }
  }

  // Ordenar candidatos por distancia (mejor match primero)
  candidates.sort((a, b) => a.distance - b.distance);

  // Asignación greedy: cada detección se casa con la mejor jugadora disponible
  const usedDetection = new Set<number>();
  const usedPlayer = new Set<string>();

  for (const { detectionIndex, playerId, distance } of candidates) {
    if (usedDetection.has(detectionIndex)) continue;
    if (usedPlayer.has(playerId)) continue;

    const player = players.find((p) => p.id === playerId);
    if (!player) continue;

    matches[detectionIndex].playerId = playerId;
    matches[detectionIndex].playerName = `${player.firstName} ${player.lastName}`;
    matches[detectionIndex].distance = distance;

    usedDetection.add(detectionIndex);
    usedPlayer.add(playerId);
  }

  return { matches, imageWidth, imageHeight };
}
