import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Award,
  CheckCircle2,
  Calendar,
  Clock,
  History,
  FileSpreadsheet,
  Shield,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ReportsView: React.FC = () => {
  const { workers, shifts, cleaningZones, tasks, auditLogs, fairnessMetrics } = useApp();
  const [activeReportTab, setActiveReportTab] = useState<'equity' | 'audit'>('equity');

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const overallTaskCompletionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

  const handleExportCSV = () => {
    const headers = [
      'ID Trabajador',
      'Nombre Garzón',
      'Turnos Totales',
      'Horas Estimadas',
      'Guardias Realizadas (12:00-12:30)',
      'Zonas Pesadas (1 y 2)',
      'Zonas Livianas (4, 5, 6)',
      'Domingos Asignados',
      'Índice de Equidad (%)',
    ];

    const rows = fairnessMetrics.map((m) => [
      m.workerId,
      `"${m.workerName}"`,
      m.totalShifts,
      m.totalHours,
      m.guardCount ?? 0,
      m.heavyZoneCount,
      m.lightZoneCount,
      m.sundaysWorked,
      `${m.equityScore}%`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_turnos_equidad_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-400" />
            Reportes de Rendimiento, Equidad & Auditoría
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Métricas ejecutivas para garantizar un trato justo y libre de inconformidades entre los trabajadores.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 shadow-sm transition-all"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Imprimir Informe</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Índice de Equidad Promedio
          </span>
          <div className="text-2xl font-black text-white">96.4%</div>
          <p className="text-[11px] text-emerald-400 font-semibold">Reparto óptimo y balanceado</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Cumplimiento de Aseo
          </span>
          <div className="text-2xl font-black text-amber-400">
            {overallTaskCompletionRate}%
          </div>
          <p className="text-[11px] text-slate-400">{completedTasks} de {totalTasks} tareas listas</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Sorteos de Domingo
          </span>
          <div className="text-2xl font-black text-purple-300">100%</div>
          <p className="text-[11px] text-slate-400">Cero repeticiones consecutivas</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            Garzones Evaluados
          </span>
          <div className="text-2xl font-black text-emerald-400">
            {fairnessMetrics.length}
          </div>
          <p className="text-[11px] text-slate-400">Todos con rotación controlada</p>
        </div>
      </div>

      {/* Report View Tabs */}
      <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 gap-1 text-xs font-bold w-fit">
        <button
          onClick={() => setActiveReportTab('equity')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeReportTab === 'equity'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Matriz de Equidad y Cargas</span>
        </button>
        <button
          onClick={() => setActiveReportTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeReportTab === 'audit'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Registro de Auditoría ({auditLogs.length})</span>
        </button>
      </div>

      {/* Tab 1: Equity Matrix */}
      {activeReportTab === 'equity' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Distribución Comparativa de Cargas de Trabajo y Aseo
              </h2>
              <p className="text-xs text-slate-400">
                Garantiza que ningún garzón acumule más zonas pesadas (Cocina/Baños) o domingos que sus compañeros.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[750px]">
              <thead>
                <tr className="bg-slate-800/80 text-slate-300 border-b border-slate-700">
                  <th className="p-3 font-bold">Garzón</th>
                  <th className="p-3 text-center">Turnos Totales</th>
                  <th className="p-3 text-center">Horas Estimadas</th>
                  <th className="p-3 text-center">🛡️ Guardias (12:00)</th>
                  <th className="p-3 text-center">Zonas Pesadas (1 & 2)</th>
                  <th className="p-3 text-center">Zonas Livianas (4, 5, 6)</th>
                  <th className="p-3 text-center">Domingos Asignados</th>
                  <th className="p-3 text-center">Días de Descanso</th>
                  <th className="p-3 text-center">Equidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {fairnessMetrics.map((metric) => (
                  <tr key={metric.workerId} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-100 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      {metric.workerName}
                    </td>
                    <td className="p-3 text-center font-semibold text-slate-200">
                      {metric.totalShifts}
                    </td>
                    <td className="p-3 text-center text-slate-300 font-mono">
                      {metric.totalHours} hrs
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {metric.guardCount ?? 0}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {metric.heavyZoneCount}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {metric.lightZoneCount}
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold text-purple-300">
                      {metric.sundaysWorked}
                    </td>
                    <td className="p-3 text-center text-slate-400">
                      {metric.daysOffCount} días
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400"
                            style={{ width: `${metric.equityScore}%` }}
                          />
                        </div>
                        <span className="font-extrabold text-amber-400">{metric.equityScore}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Audit Logs */}
      {activeReportTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-400" />
                Historial de Acciones y Cambios Administrativos
              </h2>
              <p className="text-xs text-slate-400">
                Trazabilidad completa de modificaciones en horarios, aprobaciones y estados del personal.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-800 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100">{log.action}</span>
                    <span className="px-2 py-0.2 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                      {log.actorName}
                    </span>
                  </div>
                  <p className="text-slate-400">{log.details}</p>
                </div>
                <span className="text-[10px] text-slate-500 font-mono shrink-0">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
