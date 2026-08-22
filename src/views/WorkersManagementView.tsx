import React, { useState, useRef } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Edit2,
  Trash2,
  KeyRound,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  X,
  RefreshCw,
  Palmtree,
  Stethoscope,
  UserX,
  UserCheck,
  Database,
  Download,
  Upload,
  Shield,
  HardDrive,
  Lock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Worker, WorkerStatus } from '../types';

export const WorkersManagementView: React.FC = () => {
  const {
    workers,
    addWorker,
    updateWorker,
    deleteWorker,
    updateWorkerStatus,
    generateScheduleForWeek,
    selectedWeekDate,
    currentUser,
    exportDatabaseBackup,
    importDatabaseBackup,
    resetToInitialData,
  } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add Worker Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('1234');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredRestDay, setPreferredRestDay] = useState<number>(1);
  const [notes, setNotes] = useState('');

  // Status Change Dialog State
  const [statusChangeWorker, setStatusChangeWorker] = useState<Worker | null>(null);
  const [newStatus, setNewStatus] = useState<WorkerStatus>('active');
  const [statusReason, setStatusReason] = useState('');

  const garzones = workers.filter((w) => w.role === 'worker');
  const activeCount = garzones.filter((w) => w.status === 'active').length;
  const vacationCount = garzones.filter((w) => w.status === 'vacation').length;
  const medicalCount = garzones.filter((w) => w.status === 'medical_leave').length;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importDatabaseBackup(content);
      if (res.success) {
        setBackupMessage({ type: 'success', text: res.message });
      } else {
        setBackupMessage({ type: 'error', text: res.message });
      }
      setTimeout(() => setBackupMessage(null), 4000);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const avatarUrls = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    ];
    const randomAvatar = avatarUrls[Math.floor(Math.random() * avatarUrls.length)];

    const success = addWorker({
      name,
      code: code.toUpperCase() || `GZ-${String(garzones.length + 1).padStart(2, '0')}`,
      pin,
      email: email || `${code.toLowerCase()}@restaurante.com`,
      phone: phone || '+56 9 7000 0000',
      avatar: randomAvatar,
      role: 'worker',
      status: 'active',
      preferredRestDay: Number(preferredRestDay),
      color: '#3b82f6',
      hireDate: new Date().toISOString().split('T')[0],
      notes,
    });

    if (success) {
      setIsAddModalOpen(false);
      setName('');
      setCode('');
      setPin('1234');
      setEmail('');
      setPhone('');
      setNotes('');
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorker) return;
    updateWorker(editingWorker.id, {
      name: editingWorker.name,
      code: editingWorker.code,
      pin: editingWorker.pin,
      email: editingWorker.email,
      phone: editingWorker.phone,
      preferredRestDay: editingWorker.preferredRestDay,
      notes: editingWorker.notes,
    });
    setEditingWorker(null);
  };

  const handleStatusChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusChangeWorker) return;
    updateWorkerStatus(statusChangeWorker.id, newStatus, statusReason);
    setStatusChangeWorker(null);
    setStatusReason('');
  };

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-400" />
            Gestión de Garzones & Personal (Hasta 10 Cupos)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Control de credenciales privadas, disponibilidad de turnos y gestión de licencias o vacaciones.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => generateScheduleForWeek(selectedWeekDate)}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all"
            title="Re-calcular rotación equitativa con el personal activo"
          >
            <RefreshCw className="w-4 h-4 text-amber-400" />
            <span>Redistribuir con Personal Activo</span>
          </button>

          {currentUser.role === 'admin' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Nuevo Garzón</span>
            </button>
          )}
        </div>
      </div>

      {/* Staff Capacity & Health Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Capacidad Total
          </span>
          <div className="text-2xl font-black text-white">
            {garzones.length} <span className="text-xs text-slate-500 font-semibold">/ 10 Cupos</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-indigo-500"
              style={{ width: `${(garzones.length / 10) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" />
            En Servicio Activo
          </span>
          <div className="text-2xl font-black text-emerald-400">{activeCount}</div>
          <p className="text-[11px] text-slate-400">Rotan en horarios y aseo</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <Palmtree className="w-3.5 h-3.5" />
            En Vacaciones
          </span>
          <div className="text-2xl font-black text-amber-400">{vacationCount}</div>
          <p className="text-[11px] text-slate-400">Excluidos temporalmente</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
            <Stethoscope className="w-3.5 h-3.5" />
            Licencias Médicas
          </span>
          <div className="text-2xl font-black text-rose-400">{medicalCount}</div>
          <p className="text-[11px] text-slate-400">En reposo de salud</p>
        </div>
      </div>

      {/* Database Security & Backup Management Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950/40 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Seguridad & Respaldo de Base de Datos
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Cimiento Seguro v7
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Almacenamiento tipado, validación de integridad, PIN criptográfico y exportación/importación JSON.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportDatabaseBackup}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all active:scale-95"
              title="Descargar copia de seguridad en JSON"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Exportar JSON</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all active:scale-95"
              title="Restaurar base de datos desde un archivo JSON"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>Restaurar Copia</span>
            </button>

            <button
              onClick={() => {
                if (confirm('¿Restablecer la base de datos con los trabajadores oficiales (Pierre, Roberto, Jose, Alex, Ally, Junior)?')) {
                  resetToInitialData();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-200 text-xs font-semibold rounded-xl border border-slate-700 hover:border-rose-500/40 transition-all"
              title="Restablecer a datos oficiales"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Restablecer Seed</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json,application/json"
              className="hidden"
            />
          </div>
        </div>

        {backupMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              backupMessage.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{backupMessage.text}</span>
          </div>
        )}
      </div>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workers.map((worker) => {
          const isCurrent = worker.id === currentUser.id;
          const isAdmin = worker.role === 'admin';

          return (
            <div
              key={worker.id}
              className={`bg-slate-900 border rounded-2xl p-5 shadow-lg relative flex flex-col justify-between transition-all ${
                isCurrent
                  ? 'border-indigo-500 ring-1 ring-indigo-500/40'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Top Row: Avatar, Name, Status Badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={worker.avatar}
                      alt={worker.name}
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-700"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-slate-100">{worker.name}</h3>
                        {isAdmin && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-indigo-400 font-semibold">{worker.code}</span>
                    </div>
                  </div>

                  {/* Status Toggle Badge */}
                  <button
                    onClick={() => {
                      setStatusChangeWorker(worker);
                      setNewStatus(worker.status);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                      worker.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                        : worker.status === 'vacation'
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                        : worker.status === 'medical_leave'
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                    title="Haga clic para cambiar estado (Vacaciones, Licencia, etc.)"
                  >
                    {worker.status === 'active'
                      ? '🟢 Activo'
                      : worker.status === 'vacation'
                      ? '🏖️ Vacaciones'
                      : worker.status === 'medical_leave'
                      ? '🏥 Licencia'
                      : '⚪ Inactivo'}
                  </button>
                </div>

                {/* Private Credentials & Contact Info Box */}
                <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-800 space-y-2 text-xs text-slate-300 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      PIN Acceso:
                    </span>
                    <span className="font-mono font-bold text-amber-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                      {worker.pin}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      Teléfono:
                    </span>
                    <span className="text-slate-200">{worker.phone}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      Descanso Preferido:
                    </span>
                    <span className="text-slate-200 font-semibold">
                      {worker.preferredRestDay !== undefined ? dayNames[worker.preferredRestDay] : 'Rotativo'}
                    </span>
                  </div>
                </div>

                {worker.notes && (
                  <p className="text-[11px] text-slate-400 italic mb-3">"{worker.notes}"</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
                <button
                  onClick={() => setEditingWorker(worker)}
                  className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1"
                  title="Editar datos"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>
                {!isAdmin && (
                  <button
                    onClick={() => {
                      if (confirm(`¿Seguro que deseas eliminar a ${worker.name}? Sus turnos serán liberados.`)) {
                        deleteWorker(worker.id);
                      }
                    }}
                    className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors text-xs flex items-center gap-1"
                    title="Eliminar garzón"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add Worker */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-100">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-100 mb-1">Registrar Nuevo Garzón</h3>
            <p className="text-xs text-slate-400 mb-4">
              Se creará el usuario con credenciales privadas para acceso y asignación de turnos.
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Andrés Muñoz"
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Código / Usuario</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Ej: GZ-11"
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">PIN Privado</label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="1234"
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Teléfono Móvil</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+56 9 8888 7777"
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Día de Descanso (Lunes a Viernes)
                  </label>
                  <select
                    value={preferredRestDay}
                    onChange={(e) => setPreferredRestDay(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
                  >
                    <option value={1}>Lunes (Descanso Legal)</option>
                    <option value={2}>Martes (Descanso Legal)</option>
                    <option value={3}>Miércoles (Descanso Legal)</option>
                    <option value={4}>Jueves (Descanso Legal)</option>
                    <option value={5}>Viernes (Descanso Legal)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Observaciones</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Experiencia en servicio de terraza y barra..."
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
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
                  Guardar Garzón
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Worker */}
      {editingWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-100">
            <button
              onClick={() => setEditingWorker(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-100 mb-1">Editar Datos del Garzón</h3>
            <p className="text-xs text-slate-400 mb-4">Actualizar información y credenciales.</p>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={editingWorker.name}
                  onChange={(e) => setEditingWorker({ ...editingWorker, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Código</label>
                  <input
                    type="text"
                    required
                    value={editingWorker.code}
                    onChange={(e) => setEditingWorker({ ...editingWorker, code: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">PIN Privado</label>
                  <input
                    type="password"
                    required
                    value={editingWorker.pin}
                    onChange={(e) => setEditingWorker({ ...editingWorker, pin: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={editingWorker.phone}
                  onChange={(e) => setEditingWorker({ ...editingWorker, phone: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Día de Descanso Asignado (Lunes a Viernes)
                </label>
                <select
                  value={editingWorker.preferredRestDay ?? 1}
                  onChange={(e) =>
                    setEditingWorker({ ...editingWorker, preferredRestDay: Number(e.target.value) })
                  }
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
                >
                  <option value={1}>Lunes (Descanso Legal)</option>
                  <option value={2}>Martes (Descanso Legal)</option>
                  <option value={3}>Miércoles (Descanso Legal)</option>
                  <option value={4}>Jueves (Descanso Legal)</option>
                  <option value={5}>Viernes (Descanso Legal)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingWorker(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Change Status (Active, Vacation, Leave, Resigned) */}
      {statusChangeWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-100">
            <button
              onClick={() => setStatusChangeWorker(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-100 mb-1">
              Modificar Disponibilidad de {statusChangeWorker.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Si el trabajador pasa a Vacaciones, Licencia o Renuncia, los turnos se rotarán automáticamente solo entre los garzones que queden activos.
            </p>

            <form onSubmit={handleStatusChangeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nuevo Estado</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as WorkerStatus)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 text-xs font-bold"
                >
                  <option value="active">🟢 En Servicio Activo</option>
                  <option value="vacation">🏖️ Vacaciones Programadas</option>
                  <option value="medical_leave">🏥 Licencia Médica / Reposo</option>
                  <option value="resigned">🚫 Renuncia / Retiro de Personal</option>
                  <option value="inactive">⚪ Inactivo Temporal</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Motivo / Observación del Cambio
                </label>
                <textarea
                  rows={2}
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Ej: Periodo vacacional legal o reposo médico por 15 días..."
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl p-2.5 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStatusChangeWorker(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg"
                >
                  Actualizar Disponibilidad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
