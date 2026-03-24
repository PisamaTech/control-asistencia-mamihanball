"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Progress,
  CircularProgress,
} from "@heroui/react";
import {
  getAttendanceStats,
  PlayerStat,
  ReportFilters,
  ReportPeriod,
  ReportSessionType,
} from "@/services/reportsService";

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  week: "Semana",
  month: "Mes",
  "3months": "3 Meses",
};

const SESSION_TYPE_LABELS: Record<ReportSessionType, string> = {
  all: "Todos",
  practice: "Práctica",
  game: "Partido",
};

export default function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [sessionType, setSessionType] = useState<ReportSessionType>("all");
  const [stats, setStats] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, sessionType]);

  async function load() {
    setLoading(true);
    const data = await getAttendanceStats({ period, sessionType });
    const sorted = data.sort((a, b) => b.percentage - a.percentage);
    setStats(sorted);
    setLoading(false);
  }

  async function handleExportPDF() {
    setExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const { autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();
      const periodLabel = PERIOD_LABELS[period];
      const typeLabel = SESSION_TYPE_LABELS[sessionType];
      const dateStr = new Date().toLocaleDateString("es-AR");

      doc.setFontSize(16);
      doc.text("MamiHandball — Reporte de Asistencia", 14, 20);
      doc.setFontSize(10);
      doc.text(`Período: ${periodLabel} · Tipo: ${typeLabel} · Generado: ${dateStr}`, 14, 28);

      autoTable(doc, {
        startY: 35,
        head: [["Jugadora", "Asistió", "Total", "%", "Prácticas", "Partidos"]],
        body: stats.map((s) => [
          `${s.player.firstName} ${s.player.lastName}`,
          s.totalAttended,
          s.totalSessions,
          `${s.percentage}%`,
          s.practicesAttended,
          s.gamesAttended,
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [99, 102, 241] },
      });

      doc.save(`asistencia-mamihandball-${dateStr.replace(/\//g, "-")}.pdf`);
    } finally {
      setExporting(false);
    }
  }

  const teamAverage = stats.length === 0
    ? 0
    : Math.round(stats.reduce((sum, s) => sum + s.percentage, 0) / stats.length);

  const totalSessions = stats.length > 0 ? stats[0].totalSessions : 0;
  const activePlayers = stats.length;

  return (
    <div className="max-w-2xl mx-auto w-full p-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm font-semibold tracking-wider text-default-500 uppercase mb-1">
          RENDIMIENTO
        </p>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Reportes</h1>
          <Button
            size="sm"
            className="bg-teal-600 text-white font-semibold"
            isLoading={exporting}
            isDisabled={stats.length === 0 || loading}
            onPress={handleExportPDF}
            startContent={
              !exporting && (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                </svg>
              )
            }
          >
            Exportar a PDF
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-foreground mb-3">Período</p>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(PERIOD_LABELS) as [ReportPeriod, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                period === key
                  ? "bg-teal-600 text-white shadow-md"
                  : "bg-default-200 text-default-700 hover:bg-default-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Type Selector */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-foreground mb-3">Tipo</p>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(SESSION_TYPE_LABELS) as [ReportSessionType, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSessionType(key)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                sessionType === key
                  ? "bg-teal-600 text-white shadow-md"
                  : "bg-default-200 text-default-700 hover:bg-default-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-center text-default-400 py-8">Cargando...</p>
      ) : stats.length === 0 ? (
        <p className="text-center text-default-400 py-8">Sin datos para este período.</p>
      ) : (
        <>
          {/* Team Attendance */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Asistencia del Equipo</h2>
              <Chip size="sm" className="bg-orange-200 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 font-semibold">
                PROMEDIO
              </Chip>
            </div>
            <Card className="shadow-md">
              <CardBody className="py-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CircularProgress
                      classNames={{
                        svg: "w-32 h-32",
                        track: "stroke-default-200",
                        indicator: "stroke-teal-600",
                        value: "text-3xl font-bold text-foreground"
                      }}
                      value={teamAverage}
                      strokeWidth={4}
                      showValueLabel={true}
                      formatOptions={{ style: "percent", minimumFractionDigits: 0, maximumFractionDigits: 0 }}
                    />
                    <p className="text-center text-xs text-default-500 mt-2 font-medium">ASISTENCIA</p>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="text-sm text-default-600">Presente</p>
                      <p className="text-2xl font-bold text-foreground">
                        {totalSessions} <span className="text-sm font-normal text-default-500">sesiones</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-default-600">Excusadas</p>
                      <p className="text-2xl font-bold text-foreground">
                        0 <span className="text-sm font-normal text-default-500">sesiones</span>
                      </p>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Player Performance */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Rendimiento de Jugadoras</h2>
              <Chip size="sm" className="bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 font-semibold">
                {activePlayers} Jugadoras en Total
              </Chip>
            </div>
            <div className="space-y-3">
              {stats.map((s) => (
                <Card key={s.player.id} className="shadow-sm">
                  <CardBody className="py-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {s.player.referencePhotoURLs?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={s.player.referencePhotoURLs[0]}
                            alt={s.player.firstName}
                            className="w-14 h-14 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
                            <span className="text-xl font-bold text-orange-700 dark:text-orange-300">
                              {s.player.firstName[0]}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Player Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-base">
                          {s.player.firstName} {s.player.lastName}
                        </p>
                        <p className="text-sm text-default-500">
                          {s.totalAttended}/{s.totalSessions} Sesiones
                        </p>
                      </div>

                      {/* Percentage and Progress */}
                      <div className="flex-shrink-0 text-right" style={{ width: "80px" }}>
                        <p className="text-xl font-bold text-foreground mb-1">
                          {s.percentage}%
                        </p>
                        <Progress
                          value={s.percentage}
                          classNames={{
                            base: "w-full",
                            track: "h-1 bg-default-200",
                            indicator: s.percentage >= 75
                              ? "bg-teal-600"
                              : s.percentage >= 50
                              ? "bg-orange-500"
                              : "bg-red-500"
                          }}
                        />
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
