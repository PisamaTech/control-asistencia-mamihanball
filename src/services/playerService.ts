import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type PlayerStatus = "active" | "inactive";

export type Player = {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber?: number;
  position?: string;
  status: PlayerStatus;
  referencePhotoURLs: string[];
  faceDescriptors: number[][];
  createdAt: Date | null;
};

export type NewPlayerData = {
  firstName: string;
  lastName: string;
  jerseyNumber?: number;
  position?: string;
};

const COLLECTION = "players";

export async function getPlayers(): Promise<Player[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Player));
}

export async function addPlayer(data: NewPlayerData): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    firstName: data.firstName,
    lastName: data.lastName,
    jerseyNumber: data.jerseyNumber,
    position: data.position,
    status: "active",
    referencePhotoURLs: [],
    faceDescriptors: [],
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updatePlayer(
  id: string,
  data: Partial<Omit<Player, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), data as Record<string, unknown>);
}

export async function togglePlayerStatus(
  id: string,
  current: PlayerStatus
): Promise<void> {
  const next: PlayerStatus = current === "active" ? "inactive" : "active";
  await updateDoc(doc(db, COLLECTION, id), { status: next });
}
