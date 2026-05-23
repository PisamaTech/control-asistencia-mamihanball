"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardBody,
  Checkbox,
  CheckboxGroup,
  Chip,
  DatePicker,
  Slider,
  Textarea,
} from "@heroui/react";
import { parseDate, today, getLocalTimeZone } from "@internationalized/date";
import type { DateValue } from "@internationalized/date";
import { getPlayers, Player } from "@/services/playerService";
import { addSession } from "@/services/sessionService";
import { compressImage } from "@/lib/imageCompressor";
import { recognizeFaces, type FaceMatch } from "@/lib/faceRecognition";
import { uploadSessionPhoto } from "@/services/storageService";
import { useAuth } from "@/lib/useAuth";

type Step = "form" | "processing" | "confirm";

export default function NewSessionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("form");
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessionType, setSessionType] = useState<"practice" | "game">(
    "practice",
  );
  const [sessionDate, setSessionDate] = useState<DateValue>(
    today(getLocalTimeZone()),
  );
  const [notes, setNotes] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState("");
  const [recognizedIds, setRecognizedIds] = useState<string[]>([]);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [faceMatches, setFaceMatches] = useState<FaceMatch[]>([]);
  const [imageNaturalSize, setImageNaturalSize] = useState({
    width: 0,
    height: 0,
  });
  const [isZoomed, setIsZoomed] = useState(false);
  const [detectionConfidence, setDetectionConfidence] = useState(0.6);
  const [matchThreshold, setMatchThreshold] = useState(0.55);
  const [isReprocessing, setIsReprocessing] = useState(false);

  useEffect(() => {
    getPlayers().then((all) =>
      setPlayers(all.filter((p) => p.status === "active")),
    );
  }, []);

  function handlePhotoChange(file: File | null) {
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleProcess() {
    if (!photoFile) return;
    setStep("processing");

    setProcessingStatus("Comprimiendo imagen...");
    const compressed = await compressImage(photoFile);

    setProcessingStatus("Reconociendo jugadoras...");
    const result = await recognizeFaces(compressed, players, {
      detectionConfidence,
      matchThreshold,
    });
    setFaceMatches(result.matches);
    setImageNaturalSize({
      width: result.imageWidth,
      height: result.imageHeight,
    });
    const matchedIds = result.matches
      .filter((m) => m.playerId)
      .map((m) => m.playerId!);
    setRecognizedIds(matchedIds);
    setCheckedIds(matchedIds);

    setStep("confirm");
  }

  async function handleSave() {
    if (!photoFile || !user) return;
    setSaving(true);
    try {
      const compressed = await compressImage(photoFile);
      const tempId = `session_${Date.now()}`;
      const photoURL = await uploadSessionPhoto(tempId, compressed);

      const manualIds = checkedIds.filter((id) => !recognizedIds.includes(id));

      // Convertir DateValue a Date de JavaScript
      const sessionDateJs = new Date(
        sessionDate.year,
        sessionDate.month - 1,
        sessionDate.day,
      );

      await addSession({
        date: sessionDateJs,
        type: sessionType,
        notes,
        photoURL,
        createdBy: user.uid,
        attendedPlayerIds: recognizedIds.filter((id) =>
          checkedIds.includes(id),
        ),
        manualPlayerIds: manualIds,
        allActivePlayerIds: players.map((p) => p.id),
      });

      router.push("/sessions");
    } finally {
      setSaving(false);
    }
  }

  async function handleReprocess() {
    if (!photoFile) return;
    setIsReprocessing(true);
    try {
      const compressed = await compressImage(photoFile);
      const result = await recognizeFaces(compressed, players, {
        detectionConfidence,
        matchThreshold,
      });
      setFaceMatches(result.matches);
      setImageNaturalSize({
        width: result.imageWidth,
        height: result.imageHeight,
      });
      const matchedIds = result.matches
        .filter((m) => m.playerId)
        .map((m) => m.playerId!);
      setRecognizedIds(matchedIds);
      setCheckedIds(matchedIds);
    } finally {
      setIsReprocessing(false);
    }
  }

  const inputStyles = {
    inputWrapper:
      "bg-content1 border-2 border-default-200 group-data-[focus=true]:border-transparent group-data-[focus=true]:bg-content1 group-data-[focus=true]:ring-0 group-data-[focus-visible=true]:ring-0 group-data-[focus-visible=true]:ring-offset-0 shadow-none after:hidden",
    input: "focus:ring-0 focus-visible:ring-0 outline-none",
  };

  if (step === "processing") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-default-500">{processingStatus}</p>
      </div>
    );
  }

  if (step === "confirm") {
    const unrecognized = players.filter(
      (p) => !recognizedIds.includes(p.id),
    );
    const recognized = players.filter((p) =>
      recognizedIds.includes(p.id),
    );

    return (
      <>
      <div className="bg-background h-dvh flex flex-col overflow-hidden">
        {/* ── Top: header fijo (solo título + progreso) ── */}
        <div className="shrink-0">
          <div className="max-w-2xl mx-auto w-full p-6 pb-0">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-sm font-semibold tracking-wider text-warning-700 uppercase">
                NUEVA SESIÓN
              </h1>
              <span className="text-sm text-default-500">Paso 2 de 2</span>
            </div>
            <div className="h-2 bg-default-200 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-primary-600 rounded-full"
                style={{ width: "100%" }}
              />
            </div>

            <h2 className="text-xl font-bold text-foreground mb-4">
              Confirmar Asistencia
            </h2>
          </div>
        </div>

        {/* ── Scrollable: imagen + descripción + lista de jugadoras ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto w-full px-6 pb-4">
            {photoPreview && (
              <div
                className="relative w-full rounded-xl shadow-md overflow-hidden mb-4 cursor-zoom-in"
                onClick={() => setIsZoomed(true)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoPreview}
                  alt="Foto de la sesión"
                  className="w-full h-auto block"
                />
                {/* Overlay de caras detectadas */}
                {imageNaturalSize.width > 0 &&
                  faceMatches.map((face, i) => {
                    const isMatched = face.playerId !== null;
                    return (
                      <div
                        key={i}
                        className="absolute border-2 rounded-sm pointer-events-none"
                        style={{
                          left: `${(face.box.x / imageNaturalSize.width) * 100}%`,
                          top: `${(face.box.y / imageNaturalSize.height) * 100}%`,
                          width: `${(face.box.width / imageNaturalSize.width) * 100}%`,
                          height: `${(face.box.height / imageNaturalSize.height) * 100}%`,
                          borderColor: isMatched
                            ? "#22c55e"
                            : "#ef4444",
                        }}
                      >
                        <span
                          className={`absolute -top-5 left-0 text-[10px] leading-tight font-semibold text-white px-1 rounded-sm whitespace-nowrap ${
                            isMatched
                              ? "bg-green-600/80"
                              : "bg-red-600/80"
                          }`}
                        >
                          {isMatched ? face.playerName : "?"}
                        </span>
                      </div>
                    );
                  })}
              </div>
            )}

            <p className="text-sm text-default-600 mb-4">
              {recognizedIds.length} jugadora
              {recognizedIds.length !== 1 ? "s" : ""} reconocida
              {recognizedIds.length !== 1 ? "s" : ""} automáticamente. Revisá y
              ajustá si es necesario.
            </p>

            {/* ── Ajustes de detección ── */}
            <div className="bg-content1 rounded-xl p-4 border border-default-200 mb-4">
              <p className="text-sm font-semibold text-foreground mb-3">
                Ajustes de detección
              </p>

              <div className="mb-4">
                <p className="text-xs text-default-500 mb-2">
                  Confianza de detección: menor detecta más (puede dar falsos
                  positivos)
                </p>
                <Slider
                  label="Confianza"
                  value={detectionConfidence}
                  onChange={(v) =>
                    setDetectionConfidence(v as number)
                  }
                  minValue={0.3}
                  maxValue={0.9}
                  step={0.05}
                  className="w-full"
                />
              </div>

              <div className="mb-3">
                <p className="text-xs text-default-500 mb-2">
                  Umbral de coincidencia: menor es más estricto para
                  reconocer
                </p>
                <Slider
                  label="Umbral"
                  value={matchThreshold}
                  onChange={(v) =>
                    setMatchThreshold(v as number)
                  }
                  minValue={0.3}
                  maxValue={0.8}
                  step={0.05}
                  className="w-full"
                />
              </div>

              <Button
                size="sm"
                className="w-full font-semibold"
                color="primary"
                variant="flat"
                onPress={handleReprocess}
                isLoading={isReprocessing}
              >
                Re-procesar con estos parámetros
              </Button>
            </div>

            <CheckboxGroup
              value={checkedIds}
              onValueChange={setCheckedIds}
              className="flex flex-col gap-2"
            >
              {unrecognized.length > 0 && (
                <div key="unrecognized-section">
                  <p className="text-sm font-semibold text-warning-600 mb-2 mt-1">
                    No reconocidas ({unrecognized.length})
                  </p>
                  {unrecognized.map((p) => (
                    <Card key={p.id} className="shadow-sm mb-2">
                      <CardBody className="flex flex-row items-center justify-between py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Checkbox value={p.id} />
                          <span className="font-medium">
                            {p.firstName} {p.lastName}
                          </span>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}

              {recognized.length > 0 && (
                <div key="recognized-section">
                  <p className="text-sm font-semibold text-teal-600 mb-2 mt-1">
                    Reconocidas por IA ({recognized.length})
                  </p>
                  {recognized.map((p) => (
                    <Card key={p.id} className="shadow-sm mb-2">
                      <CardBody className="flex flex-row items-center justify-between py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Checkbox value={p.id} />
                          <span className="font-medium">
                            {p.firstName} {p.lastName}
                          </span>
                        </div>
                        <Chip
                          size="sm"
                          className="bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 font-semibold"
                        >
                          IA
                        </Chip>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
            </CheckboxGroup>
          </div>
        </div>

        {/* ── Bottom: botones fijos ── */}
        <div className="shrink-0 border-t border-default-100 bg-background">
          <div className="max-w-2xl mx-auto w-full p-6">
            <div className="flex gap-3">
              <Button
                variant="bordered"
                onPress={() => setStep("form")}
                className="flex-1 h-12 font-semibold"
              >
                Volver
              </Button>
              <Button
                className="flex-1 h-12 bg-primary-600 text-white font-semibold hover:bg-primary-700"
                onPress={handleSave}
                isLoading={saving}
              >
                Guardar Sesión
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Zoom modal ── */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-50 bg-black/90 overflow-auto touch-auto"
          onClick={() => setIsZoomed(false)}
          onKeyDown={(e) => e.key === "Escape" && setIsZoomed(false)}
        >
          {/* Botón cerrar */}
          <button
            className="fixed top-4 right-4 z-10 bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl hover:bg-black/70 transition-colors"
            onClick={() => setIsZoomed(false)}
            aria-label="Cerrar zoom"
          >
            ✕
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoPreview!}
            alt="Ampliar foto"
            className="block min-h-full w-full h-auto"
            draggable={false}
          />
        </div>
      )}
      </>);
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-6 p-6 pb-24">
        {/* Header de progreso */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-sm font-semibold tracking-wider text-warning-700 uppercase">
              NUEVA SESIÓN
            </h1>
            <span className="text-sm text-default-500">Paso 1 de 2</span>
          </div>
          <div className="h-2 bg-default-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 rounded-full"
              style={{ width: "50%" }}
            />
          </div>
        </div>

        {/* Tipo de sesión */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">
            ¿Qué tipo de sesión es?
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSessionType("practice")}
              className={`p-4 rounded-xl border-2 transition-all ${
                sessionType === "practice"
                  ? "bg-content1 border-teal-600 shadow-md"
                  : "bg-default-100 border-default-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg
                  className={`w-6 h-6 ${sessionType === "practice" ? "text-teal-600" : "text-default-500"}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                </svg>
                <span
                  className={`font-semibold ${sessionType === "practice" ? "text-teal-700" : "text-default-600"}`}
                >
                  Práctica
                </span>
              </div>
            </button>

            <button
              onClick={() => setSessionType("game")}
              className={`p-4 rounded-xl border-2 transition-all ${
                sessionType === "game"
                  ? "bg-content1 border-teal-600 shadow-md"
                  : "bg-default-100 border-default-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg
                  className={`w-6 h-6 ${sessionType === "game" ? "text-teal-600" : "text-default-500"}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"
                    clipRule="evenodd"
                  />
                </svg>
                <span
                  className={`font-semibold ${sessionType === "game" ? "text-teal-700" : "text-default-600"}`}
                >
                  Partido
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Fecha de la sesión */}
        <div>
          <DatePicker
            label="Fecha de la sesión"
            value={sessionDate}
            onChange={(value) => value && setSessionDate(value)}
            labelPlacement="outside"
            showMonthAndYearPickers
            selectorButtonPlacement="start"
            classNames={{
              base: "w-full",
              label: "text-sm font-semibold text-foreground mb-2",
              inputWrapper: `${inputStyles.inputWrapper} h-12 relative`,
              input:
                "ml-8 text-default-700 focus:ring-0 focus-visible:ring-0 outline-none pointer-events-none",
              selectorButton:
                "absolute w-full h-full z-10 bg-transparent hover:w-[99%] bg-transparent justify-start px-3 min-w-0 data-[pressed=true]:scale-100 shadow-none",
            }}
          />
        </div>

        {/* Tomar foto del equipo */}
        <div className="border-2 border-dashed border-default-300 rounded-2xl p-6 bg-content1">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-primary-500/20 rounded-full w-16 h-16 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>

            <div className="text-center">
              <h3 className="font-bold text-foreground mb-1">
                Tomar Foto del Equipo
              </h3>
              <p className="text-sm text-default-500">
                Captura la asistencia visual de hoy
              </p>
            </div>
          </div>
        </div>

        {/* Botones de cámara y galería */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            size="lg"
            className="bg-warning-400 hover:bg-warning-600 text-primary-700 dark:text-primary-100 font-semibold"
            onPress={() => cameraInputRef.current?.click()}
            startContent={
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>
            }
          >
            Cámara
          </Button>

          <Button
            size="lg"
            variant="bordered"
            className="border-2 border-default-300 font-semibold"
            onPress={() => fileInputRef.current?.click()}
            startContent={
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clipRule="evenodd"
                />
              </svg>
            }
          >
            Galería
          </Button>
        </div>

        {/* Preview de foto si existe */}
        {photoPreview && (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoPreview}
              alt="Vista previa"
              className="w-full rounded-xl shadow-md"
            />
            <button
              onClick={() => {
                setPhotoFile(null);
                setPhotoPreview(null);
              }}
              className="absolute top-2 right-2 bg-danger text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg"
            >
              ✕
            </button>
          </div>
        )}

        {/* Notas */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Notas de la sesión
          </label>
          <Textarea
            placeholder="Notas de la sesión (ej: Cancha 2, clima frío)"
            value={notes}
            onValueChange={setNotes}
            minRows={3}
            classNames={{
              input:
                "text-default-700 focus:ring-0 focus-visible:ring-0 outline-none",
              inputWrapper: inputStyles.inputWrapper,
            }}
          />
        </div>

        {/* Botón siguiente */}
        <Button
          size="lg"
          isDisabled={!photoFile}
          onPress={handleProcess}
          className={`w-full h-14 text-lg font-semibold ${
            photoFile
              ? "bg-teal-600 text-white hover:bg-teal-700"
              : "bg-default-300 text-default-500 cursor-not-allowed"
          }`}
          endContent={
            photoFile && (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )
          }
        >
          Siguiente
        </Button>

        {!photoFile && (
          <p className="text-center text-sm text-default-500 -mt-4">
            Debes capturar una imagen para proceder al registro de asistencia.
          </p>
        )}

        {/* Inputs ocultos */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
        />
      </div>
    </div>
  );
}
