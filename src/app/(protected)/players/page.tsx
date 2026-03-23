"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Input,
  useDisclosure,
} from "@heroui/react";
import { getPlayers, addPlayer, updatePlayer, togglePlayerStatus, Player } from "@/services/playerService";
import { compressImage } from "@/lib/imageCompressor";
import { getDescriptor } from "@/lib/faceRecognition";
import { uploadPlayerPhoto } from "@/services/storageService";

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingStatus, setSavingStatus] = useState("");
  const [selected, setSelected] = useState<Player | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState({ firstName: "", lastName: "", jerseyNumber: "", position: "" });
  const [photoFiles, setPhotoFiles] = useState<(File | null)[]>([null, null, null]);
  const [photoPreviews, setPhotoPreviews] = useState<(string | null)[]>([null, null, null]);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setPlayers(await getPlayers());
    setLoading(false);
  }

  function openNew() {
    setSelected(null);
    setForm({ firstName: "", lastName: "", jerseyNumber: "", position: "" });
    setPhotoFiles([null, null, null]);
    setPhotoPreviews([null, null, null]);
    onOpen();
  }

  function openEdit(player: Player) {
    setSelected(player);
    setForm({
      firstName: player.firstName,
      lastName: player.lastName,
      jerseyNumber: player.jerseyNumber?.toString() ?? "",
      position: player.position ?? ""
    });
    setPhotoFiles([null, null, null]);
    setPhotoPreviews([...player.referencePhotoURLs.slice(0, 3)]);
    onOpen();
  }

  function handlePhotoChange(index: number, file: File | null) {
    if (!file) return;
    const files = [...photoFiles];
    files[index] = file;
    setPhotoFiles(files);
    const previews = [...photoPreviews];
    previews[index] = URL.createObjectURL(file);
    setPhotoPreviews(previews);
  }

  async function processPhotos(
    playerId: string,
    baseURLs: string[]
  ): Promise<{ photoURLs: string[]; descriptors: number[][] }> {
    const photoURLs = [...baseURLs];
    const descriptors: (number[] | null)[] = [null, null, null];

    for (let i = 0; i < 3; i++) {
      const file = photoFiles[i];
      if (!file) continue;

      setSavingStatus(`Procesando foto ${i + 1} de 3...`);
      const compressed = await compressImage(file);
      photoURLs[i] = await uploadPlayerPhoto(playerId, i + 1, compressed);

      setSavingStatus(`Generando descriptor ${i + 1} de 3...`);
      descriptors[i] = await getDescriptor(compressed);
    }

    // Merge with existing descriptors for unchanged photos
    const existing = selected?.faceDescriptors ?? [];
    const finalDescriptors = descriptors.map((d, i) => d ?? existing[i] ?? []);

    return { photoURLs, descriptors: finalDescriptors };
  }

  async function handleSave() {
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    setSaving(true);
    setSavingStatus("Guardando...");
    try {
      const jerseyNumber = form.jerseyNumber ? parseInt(form.jerseyNumber, 10) : undefined;
      const position = form.position.trim() || undefined;

      if (selected) {
        const { photoURLs, descriptors } = await processPhotos(
          selected.id,
          selected.referencePhotoURLs
        );
        await updatePlayer(selected.id, {
          firstName: form.firstName,
          lastName: form.lastName,
          jerseyNumber,
          position,
          referencePhotoURLs: photoURLs,
          faceDescriptors: descriptors,
        });
      } else {
        const newId = await addPlayer({
          firstName: form.firstName,
          lastName: form.lastName,
          jerseyNumber,
          position
        });
        const { photoURLs, descriptors } = await processPhotos(newId, ["", "", ""]);
        if (photoURLs.some((u) => u)) {
          await updatePlayer(newId, { referencePhotoURLs: photoURLs, faceDescriptors: descriptors });
        }
      }
      await load();
      onClose();
    } finally {
      setSaving(false);
      setSavingStatus("");
    }
  }

  async function handleToggle(player: Player) {
    await togglePlayerStatus(player.id, player.status);
    await load();
  }

  const filteredPlayers = players.filter((p) => {
    const query = searchQuery.toLowerCase();
    return (
      p.firstName.toLowerCase().includes(query) ||
      p.lastName.toLowerCase().includes(query) ||
      p.position?.toLowerCase().includes(query) ||
      p.jerseyNumber?.toString().includes(query)
    );
  });

  return (
    <div className="max-w-2xl mx-auto w-full p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Jugadoras</h1>
        <Button color="primary" size="sm" onPress={openNew}>AGREGAR JUGADORA</Button>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Buscar jugadora..."
          value={searchQuery}
          onValueChange={setSearchQuery}
          classNames={{
            inputWrapper: "bg-white border-2 border-default-200"
          }}
        />
      </div>

      {loading ? (
        <p className="text-center text-default-400">Cargando...</p>
      ) : filteredPlayers.length === 0 ? (
        <p className="text-center text-default-400">
          {searchQuery ? "No se encontraron jugadoras." : "No hay jugadoras registradas."}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredPlayers.map((p) => (
            <Card key={p.id} className="w-full">
              <CardBody className="flex flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {p.referencePhotoURLs?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.referencePhotoURLs[0]} alt={p.firstName} className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-default-200 text-lg font-bold text-default-500">
                      {p.firstName[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{p.firstName} {p.lastName}</p>
                    <div className="flex items-center gap-1 text-xs text-default-500">
                      {p.position && <span>{p.position.toUpperCase()}</span>}
                      {p.position && p.jerseyNumber && <span>•</span>}
                      {p.jerseyNumber && <span>#{p.jerseyNumber}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="flat" onPress={() => openEdit(p)}>Editar</Button>
                  <Button size="sm" variant="flat" color={p.status === "active" ? "warning" : "success"} onPress={() => handleToggle(p)}>
                    {p.status === "active" ? "Desactivar" : "Activar"}
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isOpen} onClose={onClose} placement="bottom-center">
        <ModalContent>
          <ModalHeader>{selected ? "Editar jugadora" : "Nueva jugadora"}</ModalHeader>
          <ModalBody className="flex flex-col gap-4">
            <Input label="Nombre" value={form.firstName} onValueChange={(v) => setForm((f) => ({ ...f, firstName: v }))} isRequired />
            <Input label="Apellido" value={form.lastName} onValueChange={(v) => setForm((f) => ({ ...f, lastName: v }))} isRequired />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Número de camiseta"
                type="number"
                value={form.jerseyNumber}
                onValueChange={(v) => setForm((f) => ({ ...f, jerseyNumber: v }))}
                placeholder="Ej: 10"
              />
              <Input
                label="Posición"
                value={form.position}
                onValueChange={(v) => setForm((f) => ({ ...f, position: v }))}
                placeholder="Ej: Armadora"
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-default-600">Fotos de referencia (3)</p>
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((i) => (
                  <label key={i} className="cursor-pointer">
                    <div className="flex h-24 w-full items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-default-300 bg-default-50">
                      {photoPreviews[i] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photoPreviews[i]!} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs text-default-400">Foto {i + 1}</span>
                      )}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoChange(i, e.target.files?.[0] ?? null)} />
                  </label>
                ))}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>Cancelar</Button>
            <Button color="primary" onPress={handleSave} isLoading={saving}>
              {saving ? savingStatus || "Guardando..." : "Guardar"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
