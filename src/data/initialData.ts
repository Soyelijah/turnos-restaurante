import { Worker, CleaningZone, ShiftDefinition, MealBreak } from '../types';

export const WEEKLY_LEGAL_HOURS_TARGET = 43.0;

// Standard team meal breaks (team takes lunch 12:00 - 12:30, dinner 18:00 - 18:30 = 1 hour total)
export const MEAL_BREAKS_REGULAR_TWO: MealBreak[] = [
  { name: 'Colación Mediodía (Equipo General)', time: '12:00 - 12:30', durationMinutes: 30 },
  { name: 'Colación Tarde', time: '18:00 - 18:30', durationMinutes: 30 },
];

// Guard worker meal breaks:
// 1st Break: stays on duty 12:00 - 12:30 attending customers, eats 12:30 - 13:00
// 2nd Break: stays on duty 18:00 - 18:30 attending customers, eats 18:30 - 19:00
export const MEAL_BREAKS_GUARD_TWO: MealBreak[] = [
  { name: '1ª Colación Mediodía (Post-Guardia)', time: '12:30 - 13:00', durationMinutes: 30 },
  { name: '2ª Colación Tarde (Post-Guardia)', time: '18:30 - 19:00', durationMinutes: 30 },
];

// Sunday breaks (11:00 - 18:00)
export const MEAL_BREAKS_REGULAR_SUNDAY: MealBreak[] = [
  { name: 'Colación Mediodía (Equipo General)', time: '12:00 - 12:30', durationMinutes: 30 },
];

export const MEAL_BREAKS_GUARD_SUNDAY: MealBreak[] = [
  { name: 'Colación Mediodía (Post-Guardia)', time: '12:30 - 13:00', durationMinutes: 30 },
];

export const MEAL_BREAKS_TWO = MEAL_BREAKS_REGULAR_TWO;
export const MEAL_BREAKS_ONE_SUNDAY = MEAL_BREAKS_REGULAR_SUNDAY;

export const SHIFT_SCHEDULE_CONFIG = {
  // Lunes a Miércoles Turno Apertura & Limpieza: 11:00 - 19:20 (Colación: 12:00 - 12:30 ; 18:00 - 18:30, 7.3h efectivas)
  mon_wed_open: {
    label: 'Lun-Mié Apertura Corrido (11:00 - 19:20)',
    startTime: '11:00',
    endTime: '19:20',
    grossHours: 8.3,
    effectiveHours: 7.3,
    mealBreaks: MEAL_BREAKS_REGULAR_TWO,
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  },
  // Lunes a Miércoles Turno Apertura con Pausa Intermedia & Cierre (cuando hay 4 trabajadores en total)
  // Entran a las 11:00 am a limpiar zonas, toman descanso intermedio en la tarde de 15:30 a 17:10 y cierran a las 21:00 (7.3h efectivas)
  mon_wed_split: {
    label: 'Lun-Mié Apertura 11:00 + Pausa & Cierre (11:00 - 21:00)',
    startTime: '11:00',
    endTime: '21:00',
    grossHours: 10.0,
    effectiveHours: 7.3,
    mealBreaks: [
      { name: 'Colación Mediodía', time: '12:00 - 12:30', durationMinutes: 30 },
      { name: 'Pausa Libre Intermedia', time: '15:30 - 17:10', durationMinutes: 100 },
      { name: 'Colación Cena', time: '19:30 - 20:00', durationMinutes: 30 },
    ],
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  },
  // Lunes a Miércoles Turno Cierre Corrido / Entrada Tarde: 12:40 - 21:00 (cuando hay 5 o más trabajadores)
  mon_wed_close: {
    label: 'Lun-Mié Cierre Corrido (12:40 - 21:00)',
    startTime: '12:40',
    endTime: '21:00',
    grossHours: 8.3,
    effectiveHours: 7.3,
    mealBreaks: [
      { name: 'Colación Tarde', time: '14:00 - 14:30', durationMinutes: 30 },
      { name: 'Colación Cena', time: '18:30 - 19:00', durationMinutes: 30 },
    ],
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  },
  // Jueves a Sábados Turno Apertura & Limpieza: 11:00 - 19:20 (Colación: 12:00 - 12:30 ; 18:00 - 18:30, 7.3h efectivas)
  thu_sat_open: {
    label: 'Jue-Sáb Apertura Corrido (11:00 - 19:20)',
    startTime: '11:00',
    endTime: '19:20',
    grossHours: 8.3,
    effectiveHours: 7.3,
    mealBreaks: MEAL_BREAKS_REGULAR_TWO,
    badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  },
  // Jueves a Sábados Turno Apertura con Pausa Intermedia & Cierre (cuando hay 4 trabajadores en total)
  // Entran a las 11:00 am a limpiar zonas, toman descanso intermedio en la tarde de 15:30 a 18:10 y cierran a las 22:00 (7.3h efectivas)
  thu_sat_split: {
    label: 'Jue-Sáb Apertura 11:00 + Pausa & Cierre (11:00 - 22:00)',
    startTime: '11:00',
    endTime: '22:00',
    grossHours: 11.0,
    effectiveHours: 7.3,
    mealBreaks: [
      { name: 'Colación Mediodía', time: '12:00 - 12:30', durationMinutes: 30 },
      { name: 'Pausa Libre Intermedia', time: '15:30 - 18:10', durationMinutes: 160 },
      { name: 'Colación Cena', time: '20:00 - 20:30', durationMinutes: 30 },
    ],
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  // Jueves a Sábados Turno Cierre Corrido / Entrada Tarde: 13:40 - 22:00 (cuando hay 5 o más trabajadores)
  thu_sat_close: {
    label: 'Jue-Sáb Cierre Corrido (13:40 - 22:00)',
    startTime: '13:40',
    endTime: '22:00',
    grossHours: 8.3,
    effectiveHours: 7.3,
    mealBreaks: [
      { name: 'Colación Tarde', time: '15:30 - 16:00', durationMinutes: 30 },
      { name: 'Colación Cena', time: '19:30 - 20:00', durationMinutes: 30 },
    ],
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  },
  // Domingos: 11:00 am - 18:00 hrs (Colación: 12:00 - 12:30, 6.5h efectivas, salida conjunta a las 18:00)
  sunday: {
    label: 'Turno Domingo (11:00 - 18:00)',
    startTime: '11:00',
    endTime: '18:00',
    grossHours: 7.0,
    effectiveHours: 6.5,
    mealBreaks: MEAL_BREAKS_REGULAR_SUNDAY,
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  // Día libre
  off: {
    label: 'Día Libre / Descanso',
    startTime: '-',
    endTime: '-',
    grossHours: 0,
    effectiveHours: 0,
    mealBreaks: [],
    badgeColor: 'bg-slate-700/50 text-slate-400 border-slate-600/40',
  },
};

export const SHIFT_DEFINITIONS: Record<string, ShiftDefinition> = {
  regular: {
    type: 'regular',
    label: 'Turno Jornada Regular (43h semanales)',
    startTime: '11:00',
    endTime: '21:00',
    grossHours: 10,
    effectiveHours: 9,
    mealBreaks: MEAL_BREAKS_TWO,
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  },
  off: {
    type: 'off',
    label: 'Día Libre / Descanso',
    startTime: '-',
    endTime: '-',
    grossHours: 0,
    effectiveHours: 0,
    mealBreaks: [],
    badgeColor: 'bg-slate-700/50 text-slate-400 border-slate-600/40',
  },
};

/**
 * Returns exact schedule definition according to day of the week
 * dayOfWeek: 0 = Domingo, 1 = Lunes, 2 = Martes, 3 = Miércoles, 4 = Jueves, 5 = Viernes, 6 = Sábado
 */
export function getScheduleForDayOfWeek(dayOfWeek: number, shiftVariant: 'open' | 'close' = 'open') {
  if (dayOfWeek === 0) {
    return SHIFT_SCHEDULE_CONFIG.sunday;
  }
  if (dayOfWeek >= 1 && dayOfWeek <= 3) {
    return shiftVariant === 'close'
      ? SHIFT_SCHEDULE_CONFIG.mon_wed_close
      : SHIFT_SCHEDULE_CONFIG.mon_wed_open;
  }
  return shiftVariant === 'close'
    ? SHIFT_SCHEDULE_CONFIG.thu_sat_close
    : SHIFT_SCHEDULE_CONFIG.thu_sat_open;
}

export const INITIAL_CLEANING_ZONES: CleaningZone[] = [
  {
    id: 'zone-1',
    name: 'Salón 2 (Lado Derecho)',
    priority: 1,
    color: '#ef4444', // Red / Top priority
    iconName: 'LayoutGrid',
    description: 'Salón Principal Sector Derecho. Máxima prioridad: sanitización y desinfección profunda de mesas, sillas, cartas, reposición de servilleteros y trapeado completo.',
    estimatedMinutes: 45,
    defaultTasks: [
      'Sanitizar todas las mesas del Salón 2 (Lado Derecho) y sus patas con solución hidroalcohólica',
      'Desinfectar cartas/menús, servilleteros y vinajeras del sector derecho',
      'Alinear y limpiar sillas y respaldos',
      'Barrer y trapear minuciosamente el piso del Salón 2',
      'Reponer estaciones de servicio y cubertería de apoyo',
    ],
  },
  {
    id: 'zone-2',
    name: 'Salón 1 (Lado Izquierdo)',
    priority: 2,
    color: '#f97316', // Orange / High priority
    iconName: 'Utensils',
    description: 'Salón Principal Sector Izquierdo. Aseo de superficies, alineación de mobiliario, aspirado/barrido y orden de estaciones.',
    estimatedMinutes: 40,
    defaultTasks: [
      'Sanitizar mesas y superficies de comensales en Salón 1 (Lado Izquierdo)',
      'Revisar y desinfectar cartas y porta-cuentas',
      'Alinear mesas según plano de distribución de sala',
      'Barrer y trapear minuciosamente el piso del Salón 1',
      'Limpiar zócalos y rincones de baja ventilación',
    ],
  },
  {
    id: 'zone-3',
    name: 'Baños',
    priority: 3,
    color: '#eab308', // Yellow / Medium-high priority
    iconName: 'Sparkles',
    description: 'Higiene sanitaria prioritaria. Lavado profundo de inodoros, urinarios, lavamanos, pulido de griferías y reposición continua de insumos.',
    estimatedMinutes: 45,
    defaultTasks: [
      'Lavar y desinfectar inodoros y urinarios con químico bactericida',
      'Lavar lavamanos, griferías y pulir espejos sin manchas',
      'Rellenar dispensadores de jabón líquido, toallas de papel y papel higiénico',
      'Trapear pisos con desinfectante aromatizado de larga duración',
      'Vaciar y sanitizar papeleras sanitarias con bolsas nuevas',
    ],
  },
  {
    id: 'zone-4',
    name: 'Pasillos',
    priority: 4,
    color: '#3b82f6', // Blue / Standard priority
    iconName: 'Navigation',
    description: 'Corredores de tránsito de clientes y zona de paso de garzones hacia cocina/barra. Mantener despejado, sin manchas y limpio.',
    estimatedMinutes: 30,
    defaultTasks: [
      'Barrer todo el recorrido de pasillos principales y de servicio',
      'Trapear con producto antideslizante para evitar caídas',
      'Limpiar marcas en muros, cuadros decorativos y pasamanos',
      'Verificar que las vías de escape y puertas de emergencia estén libres',
      'Ordenar repisas y mesones auxiliares de paso',
    ],
  },
  {
    id: 'zone-5',
    name: 'Ventanas',
    priority: 5,
    color: '#06b6d4', // Cyan / Maintenance priority
    iconName: 'Sun',
    description: 'Ventanales principales, mamparas divisorias, cristales exteriores e interiores a la vista de los comensales.',
    estimatedMinutes: 35,
    defaultTasks: [
      'Limpiar y desengrasar ventanales de fachada exterior e interior',
      'Pulir puertas de vidrio de acceso principal eliminando huellas dactilares',
      'Limpiar mamparas o divisiones de vidrio entre salones',
      'Secar con limpiavidrios de goma y paño de microfibra sin dejar vetas',
      'Limpiar marcos y rieles de ventanales',
    ],
  },
  {
    id: 'zone-6',
    name: 'Terrazas',
    priority: 6,
    color: '#10b981', // Emerald / Ambient priority
    iconName: 'Palmtree',
    description: 'Espacio exterior y terrazas al aire libre. Barrido perimetral, limpieza de ceniceros, mobiliario de exterior y orden de toldos.',
    estimatedMinutes: 35,
    defaultTasks: [
      'Vaciar, lavar y secar ceniceros de la terraza',
      'Limpiar y desengrasar mesas y sillas de terraza resistentes a la intemperie',
      'Barrer todo el perímetro exterior y rampa de entrada',
      'Alinear y limpiar toldos, sombrillas o estufas de exterior',
      'Recolectar residuos caídos y regar jardineras perimetrales',
    ],
  },
];

export const INITIAL_WORKERS: Worker[] = [
  {
    id: 'worker-admin',
    name: 'Carlos Mendoza',
    code: 'ADMIN',
    pin: '1234',
    email: 'admin.mendoza@restaurante.com',
    phone: '+56 9 8765 4321',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'admin',
    status: 'active',
    color: '#6366f1',
    hireDate: '2022-01-15',
    notes: 'Administrador General & Supervisor de Sala.',
  },
  {
    id: 'worker-pierre',
    name: 'Pierre S.',
    code: 'GZ-01',
    pin: '1001',
    email: 'pierre.s@restaurante.com',
    phone: '+56 9 7111 2233',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    role: 'worker',
    status: 'active',
    preferredRestDay: 1, // Lunes
    color: '#3b82f6',
    hireDate: '2023-02-10',
    notes: 'Garzón. Día de descanso legal fijado en Lunes.',
  },
  {
    id: 'worker-roberto',
    name: 'Roberto G.',
    code: 'GZ-02',
    pin: '1002',
    email: 'roberto.g@restaurante.com',
    phone: '+56 9 7222 3344',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'worker',
    status: 'active',
    preferredRestDay: 3, // Miércoles
    color: '#10b981',
    hireDate: '2023-03-15',
    notes: 'Garzón. Día de descanso legal fijado en Miércoles.',
  },
  {
    id: 'worker-jose',
    name: 'Jose C.',
    code: 'GZ-03',
    pin: '1003',
    email: 'jose.c@restaurante.com',
    phone: '+56 9 7333 4455',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    role: 'worker',
    status: 'active',
    preferredRestDay: 4, // Jueves
    color: '#f59e0b',
    hireDate: '2023-04-20',
    notes: 'Garzón. Día de descanso legal fijado en Jueves.',
  },
  {
    id: 'worker-alex',
    name: 'Alex H.',
    code: 'GZ-04',
    pin: '1004',
    email: 'alex.h@restaurante.com',
    phone: '+56 9 7444 5566',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    role: 'worker',
    status: 'active',
    preferredRestDay: 2, // Martes
    color: '#8b5cf6',
    hireDate: '2023-05-12',
    notes: 'Garzón. Día de descanso legal fijado en Martes.',
  },
  {
    id: 'worker-ally',
    name: 'Ally S.',
    code: 'GZ-05',
    pin: '1005',
    email: 'ally.s@restaurante.com',
    phone: '+56 9 7555 6677',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    role: 'worker',
    status: 'vacation', // En vacaciones
    preferredRestDay: 3, // Miércoles
    color: '#ec4899',
    hireDate: '2023-06-01',
    notes: 'En período de vacaciones anuales autorizadas.',
  },
  {
    id: 'worker-junior',
    name: 'Junior A.',
    code: 'GZ-06',
    pin: '1006',
    email: 'junior.a@restaurante.com',
    phone: '+56 9 7666 7788',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    role: 'worker',
    status: 'active',
    preferredRestDay: 5, // Viernes
    color: '#06b6d4',
    hireDate: '2023-07-10',
    notes: 'Garzón. Día de descanso legal fijado en Viernes.',
  },
];
