# Tareas completadas tras la revisión del código

La revisión se concentró en el generador semanal porque reúne reglas de negocio
críticas y no contaba con pruebas unitarias directas. Las tareas se corrigieron
junto con su cobertura de regresión en una misma entrega.

## 1. Corregir un error tipográfico en los ordinales

**Tipo:** texto/comentarios · **Estado:** completada

En los comentarios del caso de cinco o más trabajadores aparecen los ordinales
informales `5to` y `6to`. Sustituirlos por la notación española `5.º` y `6.º`
para mantener la redacción técnica consistente.

**Ubicación:** `src/utils/schedulerEngine.ts`, comentarios que describen al
quinto y sexto trabajador.

**Criterio de aceptación:** no quedan ocurrencias de `5to` ni `6to` en el
generador y el significado de los comentarios no cambia.

## 2. Corregir el doble conteo de guardias entre lunes y sábado

**Tipo:** falla funcional · **Estado:** completada

El generador selecciona y contabiliza primero `guardWorkerIds` para todos los
días. En los días que no son domingo vuelve a seleccionar `todayGuardIds` entre
el personal de apertura y vuelve a incrementar el contador de quienes terminan
como guardias. Además de contar dos veces algunas asignaciones, la primera
selección puede contabilizar a una persona de cierre que nunca recibe una
guardia en el turno emitido. Esto altera la rotación de los días posteriores.

Separar ambos caminos: seleccionar y contabilizar `guardWorkerIds` solamente
para el domingo; de lunes a sábado, seleccionar entre `openingWorkersList` y
actualizar `workerGuardCount` una sola vez por cada guardia realmente emitida.

**Ubicación:** `src/utils/schedulerEngine.ts`, selección previa de
`guardWorkerIds` y selección posterior de `todayGuardIds`.

**Criterios de aceptación:**

- cada turno marcado con `isOnGuard` incrementa el contador interno exactamente
  una vez;
- ningún turno de cierre tardío se contabiliza como guardia;
- se conserva una guardia de lunes a viernes y dos los sábados y domingos,
  siempre que exista dotación suficiente.

## 3. Alinear el comentario de la meta semanal con la configuración

**Tipo:** documentación del código · **Estado:** completada

El encabezado de `calculateFairnessMetrics` afirma que valida una meta de
`42.0 hrs`, mientras que la constante usada por la función y los comentarios
internos establecen `43.0`. Actualizar el encabezado para referirse a
`WEEKLY_LEGAL_HOURS_TARGET` y, si se incluye el valor, indicar `43.0 horas`.

**Ubicación:** `src/utils/schedulerEngine.ts`, bloque JSDoc de
`calculateFairnessMetrics`.

**Criterio de aceptación:** la documentación y el valor configurado ya no se
contradicen, y una futura modificación de la constante no deja una explicación
engañosa.

## 4. Añadir una prueba de regresión de la rotación de guardias

**Tipo:** mejora de pruebas · **Estado:** completada

Crear `src/utils/schedulerEngine.test.ts` con una dotación de al menos cinco
trabajadores activos y zonas suficientes. Generar una semana y comprobar, a
partir de los turnos resultantes, que:

1. hay exactamente una guardia cada día hábil y dos cada día del fin de semana;
2. toda persona de guardia de lunes a sábado pertenece al equipo de apertura;
3. la diferencia entre quien recibe más y menos guardias no supera una
   asignación, de modo que la selección descartada no sesga la rotación;
4. cada trabajador recibe seis turnos efectivos, un descanso y un total de
   `WEEKLY_LEGAL_HOURS_TARGET` horas;
5. el escenario es determinista: controlar `Math.random` durante el sorteo del
   domingo y restaurarlo al finalizar la prueba.

La prueba de regresión cubre el doble conteo corregido en la tarea 2. El conjunto
completo se valida con `npm test` y los tipos con `npm run lint`.
