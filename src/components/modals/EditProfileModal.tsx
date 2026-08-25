import React, { useState, useRef } from 'react';
import {
  User,
  Camera,
  Phone,
  Mail,
  KeyRound,
  Calendar,
  X,
  Save,
  CheckCircle2,
  Sparkles,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

// Preset avatar options for quick selection
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
];

const extractChileMobileDigits = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  return (digits.startsWith('56') ? digits.slice(2) : digits).slice(0, 9);
};

const formatChileMobileDigits = (digits: string): string => {
  if (digits.length <= 1) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 1)} ${digits.slice(1)}`;
  return `${digits.slice(0, 1)} ${digits.slice(1, 5)} ${digits.slice(5)}`;
};

const toStoredChileMobile = (digits: string): string =>
  `+56 ${formatChileMobileDigits(digits)}`;

export const EditProfileModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, updateWorker, triggerConfetti } = useApp();

  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(() => extractChileMobileDigits(currentUser.phone || ''));
  const [email, setEmail] = useState(currentUser.email || '');
  const [pin, setPin] = useState(currentUser.pin || '1234');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [notes, setNotes] = useState(currentUser.notes || '');
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Handle image upload from computer/phone camera or gallery
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setSaveError('Usa una imagen JPG, PNG o WebP.');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        alert('La imagen no debe superar los 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatar(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (phone.length !== 9) {
      setSaveError('Ingresa los 9 dígitos del celular, sin repetir el prefijo +56.');
      return;
    }

    const saved = updateWorker(currentUser.id, {
      name: name.trim(),
      phone: toStoredChileMobile(phone),
      email: email.trim(),
      pin: pin.trim(),
      avatar: avatar.trim(),
      notes: notes.trim(),
    });

    if (!saved) {
      setSaveError('No fue posible guardar los cambios. Revisa el correo, usa un PIN de 4 a 6 dígitos y confirma que la foto no supere 2 MB.');
      return;
    }

    setSaveError('');
    setIsSaved(true);
    triggerConfetti();

    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/90 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white">Editar Perfil & Datos Personales</h2>
            <p className="text-xs text-slate-400">
              Actualiza tu foto, teléfono de contacto y clave PIN personal
            </p>
          </div>
        </div>

        {saveError && (
          <div role="alert" className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-semibold leading-5 text-rose-200">
            {saveError}
          </div>
        )}

        {isSaved ? (
          <div className="p-8 text-center space-y-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-base font-bold text-emerald-300">¡Perfil Guardado Exitosamente!</h3>
            <p className="text-xs text-slate-300">Tus datos y foto han sido actualizados en el sistema.</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5 text-xs">
            {/* Avatar Section */}
            <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80 space-y-3">
              <label className="block font-bold text-slate-200">Foto de Perfil</label>
              
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <img
                    src={avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                    title="Subir foto desde dispositivo"
                  >
                    <Camera className="w-6 h-6 text-amber-300" />
                  </button>
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-sm"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir desde Celular / PC</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Sube una foto propia o pega el enlace URL abajo.
                  </p>
                </div>
              </div>

              {/* URL input */}
              <div>
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://ejemplo.com/mi-foto.jpg"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-semibold text-slate-400 block">O elige un avatar sugerido:</span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(url)}
                      className={`w-8 h-8 rounded-xl overflow-hidden border-2 transition-all ${
                        avatar === url ? 'border-amber-400 ring-2 ring-amber-400/40 scale-110' : 'border-slate-700 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt="Preset" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Personal Details Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl pl-9 pr-3 py-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Código de Garzón (Fijo)
                </label>
                <input
                  type="text"
                  disabled
                  value={currentUser.code}
                  className="w-full bg-slate-800/40 border border-slate-700/60 text-slate-400 rounded-xl px-3 py-2.5 font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="profile-mobile" className="block font-semibold text-slate-300 mb-1">
                  Teléfono de Contacto (WhatsApp)
                </label>
                <div className="flex h-[42px] overflow-hidden rounded-xl border border-slate-700 bg-slate-800 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20">
                  <span className="flex items-center gap-2 border-r border-slate-700 bg-slate-900/70 px-3 font-mono font-bold text-slate-300" aria-hidden="true">
                    <Phone className="h-4 w-4 text-slate-500" />
                    +56
                  </span>
                  <input
                    id="profile-mobile"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    required
                    maxLength={11}
                    value={formatChileMobileDigits(phone)}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 9));
                      setSaveError('');
                    }}
                    placeholder="9 8765 4321"
                    aria-describedby="profile-mobile-help"
                    aria-invalid={phone.length > 0 && phone.length !== 9}
                    className="min-w-0 flex-1 bg-transparent px-3 font-mono text-slate-100 outline-none placeholder:text-slate-500"
                  />
                  <span className="flex items-center pr-3 font-mono text-[10px] text-slate-500" aria-hidden="true">
                    {phone.length}/9
                  </span>
                </div>
                <p id="profile-mobile-help" className="mt-1.5 text-[10px] text-slate-500">
                  Escribe solo los 9 dígitos del celular.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="garzon@restaurante.com"
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl pl-9 pr-3 py-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  PIN de Acceso Privado (4 dígitos)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    minLength={4}
                    maxLength={6}
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl pl-9 pr-3 py-2.5 font-mono tracking-widest"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Notas / Observaciones Personales
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Alergia a mariscos, turno preferido..."
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl shadow-lg active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
