import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

export async function uploadPlayerPhoto(
  playerId: string,
  index: number,
  file: File
): Promise<string> {
  const path = `players/${playerId}/ref_${index}.jpg`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function uploadSessionPhoto(
  sessionId: string,
  file: File
): Promise<string> {
  const path = `sessions/${sessionId}/photo.jpg`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
