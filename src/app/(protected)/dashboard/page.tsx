"use client";

import { useEffect, useState } from "react";
import { Button, Card, CardBody } from "@heroui/react";
import { useRouter } from "next/navigation";
import { getDashboardStats, DashboardStats } from "@/services/dashboardService";

const SESSION_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  practice: { label: "PRÁCTICA", color: "bg-primary-100 text-primary-700" },
  game: { label: "PARTIDO", color: "bg-warning-100 text-warning-700" },
};

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="p-4 text-center text-default-400">Cargando...</p>;
  }

  const recentSessions = stats?.recentSessions || [];
  const activePlayers = stats?.activePlayers || 0;
  const teamAverage = stats?.teamAveragePercentage || 0;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-6 p-6 pb-24">
      {/* Encabezado */}
      <div>
        <p className="text-sm font-semibold tracking-wider text-primary-700 uppercase mb-1">
          PANEL DE CONTROL
        </p>
        <h1 className="text-2xl font-bold text-gray-900">¡Hola, Coach!</h1>
        <p className="text-lg font-semibold text-primary-600">Listo para la cancha.</p>
      </div>

      {/* Card principal - Nueva Sesión */}
      <Card className="bg-gradient-to-br from-primary-600 to-primary-700 shadow-lg">
        <CardBody className="p-6 gap-4">
          <div className="bg-primary-500/30 rounded-2xl w-14 h-14 flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold text-white">Registrar Nueva Sesión</h2>
            <p className="text-primary-100 text-sm">
              Toma asistencia y documenta el progreso táctico de hoy.
            </p>
          </div>

          <Button
            className="bg-white/20 hover:bg-white/30 text-white font-semibold border-2 border-white/40"
            size="lg"
            onPress={() => router.push("/sessions/new")}
            endContent={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            }
          >
            Iniciar Ahora
          </Button>
        </CardBody>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Jugadoras Activas */}
        <Card className="shadow-md">
          <CardBody className="p-4">
            <p className="text-xs font-semibold tracking-wider text-warning-700 uppercase mb-3">
              JUGADORAS<br />ACTIVAS
            </p>
            <div className="flex items-center gap-2">
              <span className="text-4xl font-bold text-gray-900">{activePlayers}</span>
              <svg className="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
          </CardBody>
        </Card>

        {/* Asistencia Promedio */}
        <Card className="shadow-md">
          <CardBody className="p-4">
            <p className="text-xs font-semibold tracking-wider text-warning-700 uppercase mb-3">
              ASISTENCIA<br />PROMEDIO
            </p>
            <div className="flex items-center gap-2">
              <span className="text-4xl font-bold text-gray-900">{teamAverage}%</span>
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Sesiones Recientes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Sesiones Recientes</h2>
          <button className="text-primary-600 text-sm font-semibold hover:text-primary-700">
            VER TODO
          </button>
        </div>

        {recentSessions.length === 0 ? (
          <p className="text-center text-default-400 py-8">
            Aún no hay datos de asistencia este mes.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {recentSessions.map((session, idx) => {
              const date = new Date(session.date);
              const day = date.getDate();
              const month = date.toLocaleDateString("es", { month: "short" }).toUpperCase();
              const sessionType = SESSION_TYPE_LABELS[session.type] || { label: session.type.toUpperCase(), color: "bg-gray-100 text-gray-700" };
              const borderColors = ["border-primary-500", "border-warning-500", "border-primary-600"];
              const borderColor = borderColors[idx % borderColors.length];

              return (
                <Card key={session.id} className="shadow-sm">
                  <CardBody className="p-0">
                    <div className="flex items-center gap-4 p-4">
                      {/* Fecha */}
                      <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-full border-2 ${borderColor} flex-shrink-0`}>
                        <span className="text-xl font-bold text-gray-900">{day}</span>
                        <span className="text-xs text-gray-500">{month}</span>
                      </div>

                      {/* Detalles */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate mb-1">
                          {sessionType.label}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          {session.notes && (
                            <span className="text-xs text-gray-500 truncate">
                              {session.notes}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Fecha corta */}
                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className="text-xs text-gray-500 uppercase">
                          {date.toLocaleDateString("es", { weekday: "short" })}
                        </span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
