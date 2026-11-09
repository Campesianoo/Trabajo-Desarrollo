# Tests automáticos

Los dos repositorios usan [Vitest](https://vitest.dev). Última ejecución completa: **22/10/2026, todos en verde**.

| Repo | Archivos | Tests | Resultado |
|:-|:-:|:-:|:-:|
| Backend | 9 | 124 | ✅ 124 pasaron |
| Frontend | 8 | 52 | ✅ 52 pasaron |

## Cómo correrlos

```bash
# Backend (desde backend/)
pnpm test            # una vez
pnpm run test:watch  # queda corriendo y repite al guardar

# Frontend (desde la raíz del repo)
npm test
npm run test:watch
```

No hace falta tener una base de datos ni el servidor levantado.

## Backend

Usa [supertest](https://github.com/ladjs/supertest) para llamar a la API real (la app de Express completa, con sus middlewares y controladores) sin abrir un puerto. Con `NODE_ENV=test` la conexión se reemplaza por una base **SQLite en memoria**, así que **nunca toca la base real** aunque el `.env` tenga `DATABASE_URL` ([decisión 10](decisiones.md#10-los-tests-de-integración-usan-sqlite-en-memoria)).

### Unitarios (`backend/tests/unit`)

| Archivo | Qué prueba |
|:-|:-|
| `http.test.js` | `toPositiveInt`, `isValidEmail`, `esErrorDeReferencia` (entradas válidas e inválidas) |
| `membresia.test.js` | `fechaValida` (rechaza `2026-02-30`, años no bisiestos, formatos raros), `valorValido` (rangos, redondeo a 2 decimales), `calcularEstado` (Pendiente / Activa / Por vencer / Vencida, incluidos los bordes) |
| `password.test.js` | Largo mínimo y máximo, hash y verificación, usuario inexistente |
| `renovacion.test.js` | Suma de días y fechas de la renovación (sin membresías, al día, vence hoy, vencida) |
| `strikes.test.js` | Strikes por ausencias: dos no bloquean, la tercera en 30 días bloquea 7 días (incluido el último), ausencias separadas por más de 30 días o viejas no cuentan, orden de las fechas |

### Integración (`backend/tests/integration`)

| Archivo | Qué prueba |
|:-|:-|
| `auth.test.js` | Login correcto (cookie `httpOnly`), mismo `401` para email inexistente y contraseña incorrecta, `/auth/me` sin y con sesión, rechazo de un origen no permitido (CSRF), logout |
| `clientes-membresias.test.js` | Alta de cliente (crea la cuenta con contraseña = DNI), DNI repetido `409`, email inválido `400`, permisos por rol (`403`), estado de la membresía según las fechas, el profesor no ve membresías, el cliente solo ve las suyas, listado de clientes con `membresia` (y sin ese campo para el profesor), borrado en cascada |
| `renovacion.test.js` | Renovar membresía: la propuesta (primera vez, al día, vencida), alta con importe, encadenado sin huecos ni superposiciones, validaciones, permisos (`403`) y que después de renovar el cliente pueda reservar |
| `turnos.test.js` | Tipos de clase y turnos (validaciones y permisos), plantillas que generan 30 días sin duplicarse, inscripción (membresía que cubra el día del turno, cupo, 8 horas de anticipación, un turno por día, sin duplicados, cancelar y volver a anotarse), qué ve cada rol, registro de asistencia (profesor del turno, estados válidos, turno futuro), edición de una serie de turnos desde la plantilla o desde un turno generado, strikes (con 3 ausencias en 30 días no puede reservar; el admin, el profesor y el propio cliente ven los strikes) y reglas de borrado |

## Frontend

[Testing Library](https://testing-library.com/docs/react-testing-library/intro) sobre jsdom.

| Archivo | Qué prueba |
|:-|:-|
| `src/utils/membresia.test.ts` | Formato de fechas, suma de días (cruces de mes/año y bisiestos), días hasta el vencimiento, elección de la membresía vigente |
| `src/components/auth/ProtectedRoute.test.tsx` | Deja pasar al rol permitido, manda al login sin sesión, redirige a un cliente que intenta entrar a `/admin`, no muestra nada mientras se restaura la sesión |
| `src/components/cliente/ClienteCard.test.tsx` | Muestra el estado de membresía y su vencimiento, "Sin membresía", no muestra membresía en la vista del profesor, aviso de contraseña inicial, botón "Ver detalle" |
| `src/context/ColorModeProvider.test.tsx` | Tema claro por defecto, aplica y guarda el modo oscuro, recuerda la elección, ignora valores inválidos |
| `src/utils/turno.test.ts` | Formato de horas y días, lugares libres y turno completo, inscripción vigente, horas que faltan para el inicio, membresía que cubre el día, texto de los strikes (para el cliente y para el admin) |
| `src/components/membresia/RenovarMembresiaDialog.test.tsx` | Muestra las fechas calculadas y el último importe, registra el pago, exige el importe la primera vez, rechaza importes inválidos y muestra el error si falla |
| `src/components/membresia/HistorialPagosDialog.test.tsx` | Historial de pagos del cliente del más reciente al más antiguo, cerrar el diálogo y abrirlo desde la tarjeta |
| `src/components/turno/TurnoCard.test.tsx` | Horario, clase, profesor y lugares; turno completo; sin profesor; plantilla "Todos los días"; acciones |

## Test end-to-end (frontend)

[Playwright](https://playwright.dev) maneja un **navegador real** contra el frontend, el backend y la base de datos reales: no hay nada simulado. Está en `e2e/` del repo del frontend.

| Archivo | Qué recorre |
|:-|:-|
| `e2e/acceso.spec.ts` | Sin sesión una pantalla protegida manda al login; credenciales incorrectas muestran el error; el admin entra, ve su menú y cierra sesión; un cliente entra a su pantalla y **no puede entrar a las del administrador** |
| `e2e/reserva.spec.ts` | El recorrido de los tres casos de uso, solo con la interfaz: el admin crea una clase y da de alta un cliente, **renueva su membresía** (CUU 3), crea un turno; el cliente entra con su DNI y **reserva su lugar** (CUU 1) y lo ve en Mis Clases; el admin ve al cliente anotado en el detalle del turno |

Cada corrida crea datos propios (DNI y nombres únicos) y **los borra al terminar**, así que se puede correr contra una base compartida o un deploy sin dejar basura. Resultado de la última ejecución, contra el backend con PostgreSQL real:

```text
  ok 1 acceso  › sin sesión, una pantalla protegida manda al login
  ok 2 acceso  › con credenciales incorrectas muestra un mensaje y no entra
  ok 3 acceso  › el administrador entra a su panel, ve el menú completo y puede cerrar sesión
  ok 4 acceso  › un cliente entra a su pantalla y no puede entrar a las del administrador
  ok 5 reserva › el admin prepara la clase y la membresía, y el cliente reserva su lugar
  5 passed (1.5m)
```

### Cómo correrlo

1. Tener el backend corriendo con una base PostgreSQL (ver [instalación](instalacion.md)) y una cuenta de administrador (`pnpm run create-admin`).
2. En el frontend, una sola vez, instalar el navegador de prueba: `npx playwright install chromium` (o usar uno ya instalado con `E2E_BROWSER_CHANNEL=msedge`).
3. Correr los tests con las credenciales del admin:

```bash
# Linux / macOS
E2E_ADMIN_EMAIL=admin@correo.com E2E_ADMIN_PASSWORD=la-clave npm run test:e2e

# Windows (PowerShell)
$env:E2E_ADMIN_EMAIL = "admin@correo.com"; $env:E2E_ADMIN_PASSWORD = "la-clave"; npm run test:e2e
```

Levanta solo el frontend (Vite) y lo conecta al backend de `E2E_API_URL` (por defecto `http://localhost:3000`). Para probar una app **ya desplegada** se define `E2E_BASE_URL` con su dirección y no se levanta nada local. Las credenciales nunca se guardan en el repositorio.

## Lo que no cubren

- Los **test end-to-end** cubren el recorrido principal y el control de acceso, no cada pantalla: el resto de las pantallas se verificó a mano en el navegador.
- La **concurrencia** (dos renovaciones a la vez) no se puede probar con SQLite en memoria, que usa una sola conexión: se verificó a mano contra PostgreSQL.
- Las **migraciones** no se prueban con SQLite (usan SQL de PostgreSQL): se ejercitan al levantar el servidor contra una base PostgreSQL vacía.

## Evidencia

Salida resumida de la última ejecución:

```text
Backend
 Test Files  9 passed (9)
      Tests  124 passed (124)

Frontend (vitest)
 Test Files  8 passed (8)
      Tests  52 passed (52)

Frontend (Playwright, e2e)
  5 passed
```
