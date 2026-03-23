import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function isAuthorized(uid: string): Promise<boolean> {
  const ref = doc(db, "authorizedUsers", uid);
  const snap = await getDoc(ref);
  return snap.exists();
}
