"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, CardBody, Chip, Divider } from "@heroui/react";
import { getSessions, getSessionDetail, Session, SessionDetail } from "@/services/sessionService";

const TYPE_LABEL = { practice: "Práctica", game: "Partido" };
const METHOD_LABEL: Record<string, string> = { facial: "IA", manual: "Manual" };

export default function SessionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("id");

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [detail, setDetail] = useState<SessionDetail | null | undefined>(undefined);

  useEffect(() => {
    getSessions().then((s) => { setSessions(s); setLoadingList(false); });
  }, []);

  useEffect(() => {
    if (!selectedId) { setDetail(undefined); return; }
    setDetail(undefined);
    getSessionDetail(selectedId).then(setDetail);
  }, [selectedId]);

  // Detail view
  if (selectedId) {
    if (detail === undefined) {
      return <p className="p-4 text-center text-default-400">Cargando...</p>;
    }
    if (detail === null) {
      return (
        <div className="p-4 text-center">
          <p className="text-default-500">Sesión no encontrada.</p>
          <Button className="mt-4" variant="flat" onPress={() => router.push("/sessions")}>Volver</Button>
        </div>
      );
    }

    const { session, attended, absent } = detail;
    return (
      <div className="max-w-2xl mx-auto w-full p-4">
        <Button size="sm" variant="light" onPress={() => router.push("/sessions")} className="mb-3 -ml-2">
          ← Volver
        </Button>
        <h1 className="mb-1 text-xl font-bold">
          {session.date.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
        </h1>
        <Chip variant="flat" color={session.type === "game" ? "warning" : "primary"} className="mb-4">
          {TYPE_LABEL[session.type]}
        </Chip>
        {session.photoURL && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={session.photoURL} alt="Foto" className="mb-4 w-full rounded-xl object-cover" style={{ maxHeight: 220 }} />
        )}
        {session.notes && <p className="mb-4 text-sm text-default-500">{session.notes}</p>}

        <h2 className="mb-2 font-semibold text-success">Presentes ({attended.length})</h2>
        <div className="flex flex-col gap-2 mb-4">
          {attended.length === 0 && <p className="text-sm text-default-400">Ninguna.</p>}
          {attended.map(({ player, method }) => (
            <Card key={player.id} className="w-full">
              <CardBody className="flex flex-row items-center justify-between py-2">
                <span className="font-medium">{player.firstName} {player.lastName}</span>
                <Chip size="sm" variant="flat" color={method === "facial" ? "primary" : "default"}>
                  {METHOD_LABEL[method] ?? method}
                </Chip>
              </CardBody>
            </Card>
          ))}
        </div>
        <Divider className="my-4" />
        <h2 className="mb-2 font-semibold text-default-500">Ausentes ({absent.length})</h2>
        <div className="flex flex-col gap-2">
          {absent.length === 0 && <p className="text-sm text-default-400">Todas presentes.</p>}
          {absent.map((player) => (
            <Card key={player.id} className="w-full opacity-60">
              <CardBody className="py-2">
                <span>{player.firstName} {player.lastName}</span>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // List view
  if (loadingList) return <p className="max-w-2xl mx-auto w-full p-4 text-center text-default-400">Cargando...</p>;
  if (sessions.length === 0) return <p className="max-w-2xl mx-auto w-full p-4 text-center text-default-400">No hay sesiones registradas.</p>;

  return (
    <div className="max-w-2xl mx-auto w-full p-4">
      <h1 className="mb-4 text-xl font-bold">Historial de sesiones</h1>
      <div className="flex flex-col gap-3">
        {sessions.map((s) => (
          <Card
            key={s.id}
            isPressable
            onPress={() => router.push(`/sessions?id=${s.id}`)}
            className="w-full"
          >
            <CardBody className="flex flex-row items-center justify-between">
              <div>
                <p className="font-semibold">
                  {s.date.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
                <Chip size="sm" variant="flat" color={s.type === "game" ? "warning" : "primary"} className="mt-1">
                  {TYPE_LABEL[s.type]}
                </Chip>
              </div>
              <span className="text-default-400">›</span>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
