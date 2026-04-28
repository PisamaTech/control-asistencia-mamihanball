import {
  collection,
  doc,
  getDoc,
  getDocs,
  writeBatch,
  query,
  orderBy,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Player } from "./playerService";

export type SessionDetail = {
  session: Session;
  attended: { player: Player; method: string }[];
  absent: Player[];
};

export type SessionType = "practice" | "game";

export type Session = {
  id: string;
  date: Date;
  type: SessionType;
  notes: string;
  photoURL: string;
  createdBy: string;
  createdAt: Date | null;
};

export type NewSessionData = {
  date: Date;
  type: SessionType;
  notes: string;
  photoURL: string;
  createdBy: string;
  attendedPlayerIds: string[];
  manualPlayerIds: string[];
  allActivePlayerIds: string[];
};

export async function addSession(data: NewSessionData): Promise<string> {
  const batch = writeBatch(db);

  const sessionRef = doc(collection(db, "sessions"));

  batch.set(sessionRef, {
    date: data.date,
    type: data.type,
    notes: data.notes,
    photoURL: data.photoURL,
    createdBy: data.createdBy,
    createdAt: serverTimestamp(),
  });

  const attendedSet = new Set(data.attendedPlayerIds);
  const manualSet = new Set(data.manualPlayerIds);

  for (const playerId of data.allActivePlayerIds) {
    const attended = attendedSet.has(playerId) || manualSet.has(playerId);
    const method = manualSet.has(playerId)
      ? "manual"
      : attendedSet.has(playerId)
      ? "facial"
      : "none";

    const attendanceRef = doc(collection(db, "attendance"));
    batch.set(attendanceRef, {
      sessionId: sessionRef.id,
      sessionDate: data.date,
      sessionType: data.type,
      playerId,
      attended,
      method,
      createdAt: serverTimestamp(),
    });
  }

  await batch.commit();
  return sessionRef.id;
}

export async function getSessions(): Promise<Session[]> {
  const q = query(collection(db, "sessions"), orderBy("date", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      date: data.date?.toDate?.() ?? new Date(data.date),
      type: data.type,
      notes: data.notes,
      photoURL: data.photoURL,
      createdBy: data.createdBy,
      createdAt: data.createdAt?.toDate?.() ?? null,
    } as Session;
  });
}

export async function getSessionDetail(
  id: string
): Promise<SessionDetail | null> {
  const sessionSnap = await getDoc(doc(db, "sessions", id));
  if (!sessionSnap.exists()) return null;

  const data = sessionSnap.data();
  const session: Session = {
    id: sessionSnap.id,
    date: data.date?.toDate?.() ?? new Date(data.date),
    type: data.type,
    notes: data.notes,
    photoURL: data.photoURL,
    createdBy: data.createdBy,
    createdAt: data.createdAt?.toDate?.() ?? null,
  };

  const attendanceSnap = await getDocs(
    query(collection(db, "attendance"), where("sessionId", "==", id))
  );
  const playersSnap = await getDocs(collection(db, "players"));

  const playersMap = new Map<string, Player>(
    playersSnap.docs.map((d) => [d.id, { id: d.id, ...d.data() } as Player])
  );

  const attended: { player: Player; method: string }[] = [];
  const absentIds = new Set(playersMap.keys());

  for (const att of attendanceSnap.docs) {
    const { playerId, attended: wasPresent, method } = att.data();
    const player = playersMap.get(playerId);
    if (!player) continue;
    if (wasPresent) {
      attended.push({ player, method });
      absentIds.delete(playerId);
    }
    // attended: false → stays in absentIds
  }

  const absent = [...absentIds]
    .map((pid) => playersMap.get(pid)!)
    .filter(Boolean);

  return { session, attended, absent };
}

export async function deleteSession(sessionId: string): Promise<void> {
  const batch = writeBatch(db);

  // 1. Borrar la sesión
  batch.delete(doc(db, "sessions", sessionId));

  // 2. Buscar y borrar asistencias relacionadas
  const attendanceSnap = await getDocs(
    query(collection(db, "attendance"), where("sessionId", "==", sessionId))
  );
  attendanceSnap.forEach((d) => batch.delete(d.ref));

  await batch.commit();
}

export async function updateSession(
  sessionId: string,
  data: Partial<Omit<Session, "id" | "createdBy" | "createdAt">>
): Promise<void> {
  const batch = writeBatch(db);
  const sessionRef = doc(db, "sessions", sessionId);
  batch.update(sessionRef, data);

  // Si se cambia la fecha o el tipo, actualizar también los registros de asistencia
  if (data.date || data.type) {
    const attendanceSnap = await getDocs(
      query(collection(db, "attendance"), where("sessionId", "==", sessionId))
    );
    attendanceSnap.forEach((d) => {
      const updates: any = {};
      if (data.date) updates.sessionDate = data.date;
      if (data.type) updates.sessionType = data.type;
      batch.update(d.ref, updates);
    });
  }

  await batch.commit();
}

