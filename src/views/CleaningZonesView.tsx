import React, { useState } from 'react';
import {
  Layers,
  ArrowUp,
  ArrowDown,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Flame,
  Utensils,
  Wine,
  Sun,
  Archive,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  ListTodo,
  Check,
  Save,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CleaningZone } from '../types';

export const CleaningZonesView: React.FC = () => {
  const {
    cleaningZones,
    updateZonePriority,
    updateZone,
    updateZoneTasks,
    addZone,
    deleteZone,
    workers,
    shifts,
    fairnessMetrics,
    currentUser,
    triggerConfetti,
  } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<CleaningZone | null>(null);
  const [deletingZoneId, setDeletingZoneId] = useState<string | null>(null);

  // New Zone Form State
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneDescription, setNewZoneDescription] = useState('');
  const [newZoneColor, setNewZoneColor] = useState('#3b82f6');
  const [newZoneMinutes, setNewZoneMinutes] = useState(30);
  const [newZoneTasks, setNewZoneTasks] = useState('Desinfectar superficies\nBarrer y trapear\nVaciar contenedores');

  // Edit Zone Form State
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState('#3b82f6');
  const [editMinutes, setEditMinutes] = useState(30);
  const [editTasks, setEditTasks] = useState<string[]>([]);
  const [newTaskInput, setNewTaskInput] = useState('');

  // Sorted zones by priority 1 to N
  const sortedZones = [...cleaningZones].sort((a, b) => a.priority - b.priority);

  const movePriority = (zoneId: string, direction: 'up' | 'down') => {
    const currentIndex = sortedZones.findIndex((z) => z.id === zoneId);
    if (currentIndex === -1) return;

    if (direction === 'up' && currentIndex > 0) {
      const prevZone = sortedZones[currentIndex - 1];
      const targetPriority = prevZone.priority;
      const currentPriority = sortedZones[currentIndex].priority;
      updateZonePriority(zoneId, targetPriority);
      updateZonePriority(prevZone.id, currentPriority);
    } else if (direction === 'down' && currentIndex < sortedZones.length - 1) {
      const nextZone = sortedZones[currentIndex + 1];
      const targetPriority = nextZone.priority;
      const currentPriority = sortedZones[currentIndex].priority;
      updateZonePriority(zoneId, targetPriority);
      updateZonePriority(nextZone.id, currentPriority);
    }
  };

  const handleOpenEdit = (zone: CleaningZone) => {
    setEditingZone(zone);
    setEditName(zone.name);
    setEditDescription(zone.description);
    setEditColor(zone.color);
    setEditMinutes(zone.estimatedMinutes);
    setEditTasks([...zone.defaultTasks]);
    setNewTaskInput('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingZone || !editName.trim()) return;

    const cleanedTasks = editTasks.filter((t) => t.trim().length > 0);

    updateZone(editingZone.id, {
      name: editName.trim(),
      description: editDescription.trim(),
      color: editColor,
      estimatedMinutes: Number(editMinutes),
      defaultTasks: cleanedTasks,
    });

    setEditingZone(null);
    triggerConfetti();
  };

  const handleAddEditTask = () => {
    if (!newTaskInput.trim()) return;
    setEditTasks([...editTasks, newTaskInput.trim()]);
    setNewTaskInput('');
  };

  const handleRemoveEditTask = (idxToRemove: number) => {
    setEditTasks(editTasks.filter((_, idx) => idx !== idxToRemove));
  };

  const handleAddZone = (e: React.FormEvent) => {
    e.preventDefault();
    const taskList = newZoneTasks
      .split('\n')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    addZone({
      name: newZoneName,
      description: newZoneDescription,
      priority: sortedZones.length + 1,
      color: newZoneColor,
      iconName: 'Sparkles',
      estimatedMinutes: Number(newZoneMinutes),
      defaultTasks: taskList.length > 0 ? taskList : ['Limpieza general del área'],
    });

    setIsAddModalOpen(false);
    setNewZoneName('');
    setNewZoneDescription('');
    setNewZoneTasks('Desinfectar superficies\nBarrer y trapear\nVaciar contenedores');
    triggerConfetti();
  };

  const confirmDeleteZone = (zoneId: string) => {
    deleteZone(zoneId);
    setDeletingZoneId(null);
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame':
        return <Flame className="w-5 h-5" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5" />;
      case 'Utensils':
        return <Utensils className="w-5 h-5" />;
      case 'Wine':
        return <Wine className="w-5 h-5" />;
      case 'Sun':
        return <Sun className="w-5 h-5" />;
      case 'Archive':
        return <Archive className="w-5 h-5" />;
      default:
        return <Layers className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-amber-400" />
            Zonas de Limpieza & Gestión de Checklists
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Crea, edita o elimina zonas y personaliza los checklists de tareas que verán los garzones en su turno.
          </p>
        </div>

        {currentUser.role === 'admin' && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all self-start sm:self-auto active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Nueva Zona</span>
          </button>
        )}
      </div>

      {/* Ranked Cleaning Zones Cards */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Jerarquía Oficial de Zonas de Aseo ({sortedZones.length} zonas activas)
          </span>
          {currentUser.role === 'admin' && (
            <span className="text-[11px] font-normal text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Modo Administrador: Puedes editar o borrar checklists
            </span>
          )}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedZones.map((zone, index) => (
            <div
              key={zone.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between"
              style={{
                borderLeftWidth: '5px',
                borderLeftColor: zone.color,
              }}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="p-2.5 rounded-xl text-white shadow-md shrink-0"
                      style={{ backgroundColor: zone.color }}
                    >
                      {renderIcon(zone.iconName)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px] font-black uppercase px-2 py-0.5 rounded text-white"
                          style={{ backgroundColor: zone.color }}
                        >
                          Prioridad #{zone.priority}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          ~{zone.estimatedMinutes} min
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-1">{zone.name}</h3>
                    </div>
                  </div>

                  {/* Actions & Reordering (Admin only) */}
                  {currentUser.role === 'admin' && (
                    <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
                      <button
                        onClick={() => handleOpenEdit(zone)}
                        className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-slate-700 rounded-lg transition-colors"
                        title="Modificar zona y checklist de tareas"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingZoneId(zone.id)}
                        className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-slate-700 rounded-lg transition-colors"
                        title="Eliminar zona"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-px h-4 bg-slate-700 mx-0.5" />
                      <button
                        onClick={() => movePriority(zone.id, 'up')}
                        disabled={index === 0}
                        className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-700"
                        title="Subir prioridad"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => movePriority(zone.id, 'down')}
                        disabled={index === sortedZones.length - 1}
                        className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-700"
                        title="Bajar prioridad"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                  {zone.description}
                </p>

                {/* Checklist Preview */}
                <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/60 space-y-1.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <ListTodo className="w-3.5 h-3.5 text-amber-400" />
                      Checklist Obligatorio ({zone.defaultTasks.length} tareas):
                    </span>
                    {currentUser.role === 'admin' && (
                      <button
                        onClick={() => handleOpenEdit(zone)}
                        className="text-[10px] font-bold text-amber-400 hover:text-amber-300 hover:underline"
                      >
                        + Editar Checklist
                      </button>
                    )}
                  </div>
                  {zone.defaultTasks.map((task, tIdx) => (
                    <div key={tIdx} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{task}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fairness Matrix: Rotation balance & Anti-Repetition Audit Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              Auditoría de Rotación Equitativa & No-Repetición de Domingos
            </h2>
            <p className="text-xs text-slate-400">
              Verificación algorítmica de equidad: balance de zonas pesadas (Salones y Baños) y registro de domingos.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-800/80 text-slate-300 border-b border-slate-700">
                <th className="p-3 font-bold">Garzón</th>
                <th className="p-3 text-center">Turnos Totales</th>
                <th className="p-3 text-center">Zonas Pesadas (1 & 2)</th>
                <th className="p-3 text-center">Zonas Livianas (4, 5, 6)</th>
                <th className="p-3 text-center">Domingos Trabajados</th>
                <th className="p-3">Historial Domingos (Sin Repetición)</th>
                <th className="p-3 text-center">Índice de Equidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {fairnessMetrics.map((metric) => (
                <tr key={metric.workerId} className="hover:bg-slate-800/40">
                  <td className="p-3 font-bold text-slate-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    {metric.workerName}
                  </td>
                  <td className="p-3 text-center font-semibold text-slate-200">
                    {metric.totalShifts}
                  </td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {metric.heavyZoneCount} veces
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {metric.lightZoneCount} veces
                    </span>
                  </td>
                  <td className="p-3 text-center font-bold text-purple-300">
                    {metric.sundaysWorked}
                  </td>
                  <td className="p-3">
                    {metric.sundayZoneHistory.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {metric.sundayZoneHistory.map((h, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            title={`${h.date}: ${h.zoneName}`}
                          >
                            {h.zoneName.split(':')[0]}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500 italic text-[11px]">Sin domingos previos</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <span className="px-2.5 py-1 rounded-lg font-black text-amber-400 bg-amber-500/10 border border-amber-500/20">
                      {metric.equityScore}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Zone & Checklist Modal */}
      {editingZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingZone(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div
                className="p-3 rounded-xl text-white shadow-md"
                style={{ backgroundColor: editColor }}
              >
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-white">
                  Editar Zona & Checklist de Tareas
                </h3>
                <p className="text-xs text-slate-400">
                  Modifica los datos y añade o quita ítems del checklist
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nombre de la Zona</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl p-3 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tiempo Estimado (min)</label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={editMinutes}
                    onChange={(e) => setEditMinutes(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Color Identificador</label>
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-full h-9 bg-slate-800 border border-slate-700 rounded-xl p-1 cursor-pointer"
                  />
                </div>
              </div>

              {/* Checklist Items Management */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block font-bold text-amber-300">
                  Tareas del Checklist ({editTasks.length} ítems)
                </label>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {editTasks.map((task, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-800/80 border border-slate-700"
                    >
                      <span className="text-xs text-slate-200 flex-1">{task}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEditTask(idx)}
                        className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded"
                        title="Eliminar esta tarea del checklist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {editTasks.length === 0 && (
                    <p className="text-xs text-slate-500 italic p-2 text-center">
                      No hay tareas en el checklist. Agrega al menos una abajo.
                    </p>
                  )}
                </div>

                {/* Add new task input */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newTaskInput}
                    onChange={(e) => setNewTaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddEditTask();
                      }
                    }}
                    placeholder="Escribe una nueva tarea obligatoria..."
                    className="flex-1 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddEditTask}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shrink-0"
                  >
                    + Agregar
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingZone(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-lg"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Zona & Checklist</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingZoneId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-slate-900 border border-rose-500/40 rounded-2xl p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">¿Eliminar esta Zona de Aseo?</h3>
            </div>
            <p className="text-xs text-slate-300">
              Esta acción eliminará permanentemente la zona y su checklist de la rotación semanal.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingZoneId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmDeleteZone(deletingZoneId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-600/30"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Zone Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-100 mb-1">Añadir Nueva Zona de Aseo</h3>
            <p className="text-xs text-slate-400 mb-4">
              Se insertará en el sistema de rotación y generará tareas para los garzones.
            </p>

            <form onSubmit={handleAddZone} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nombre de la Zona</label>
                <input
                  type="text"
                  required
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  placeholder="Ej: Zona 7: Estación de Postres & Copería"
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  required
                  value={newZoneDescription}
                  onChange={(e) => setNewZoneDescription(e.target.value)}
                  placeholder="Descripción sanitaria y objetivos del área..."
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl p-3 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tiempo Estimado (min)</label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={newZoneMinutes}
                    onChange={(e) => setNewZoneMinutes(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Color Identificador</label>
                  <input
                    type="color"
                    value={newZoneColor}
                    onChange={(e) => setNewZoneColor(e.target.value)}
                    className="w-full h-9 bg-slate-800 border border-slate-700 rounded-xl p-1 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Tareas del Checklist (Una por línea)
                </label>
                <textarea
                  rows={4}
                  required
                  value={newZoneTasks}
                  onChange={(e) => setNewZoneTasks(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl p-3 resize-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg"
                >
                  Guardar Zona
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
