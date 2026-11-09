# Arquitectura

## Visión general

```mermaid
flowchart LR
    U[Navegador] -->|HTTPS| V[Frontend<br/>React + Vite<br/>Vercel]
    V -->|"/api/* (rewrite)"| R[Backend<br/>Express<br/>Render]
    R -->|Sequelize| D[(PostgreSQL<br/>Supabase)]
```

El navegador **solo habla con el origen del frontend**. Las llamadas a `/api` las reenvía Vite en desarrollo y Vercel en producción (`vercel.json`) al backend. Por eso la cookie de sesión es "del mismo sitio" y no la bloquean los navegadores.

## Capas del backend

```mermaid
flowchart TD
    A[routes/*<br/>URL + roles autorizados] --> B[middlewares/<br/>authenticate · authorize · CSRF]
    B --> C[controllers/*<br/>validación + reglas de negocio]
    C --> D[models/*<br/>Sequelize + asociaciones]
    D --> E[(PostgreSQL)]
    C --> F[utils/<br/>http · password · membresia]
```

| Capa | Carpeta | Responsabilidad |
|:-|:-|:-|
| Rutas | `backend/src/routes` | Mapea URL y método a un controlador y define qué roles pueden usarla |
| Middlewares | `backend/src/middlewares` | `authenticate` (valida el JWT y vuelve a consultar al usuario), `authorize(...roles)`, chequeo de origen (CSRF) |
| Controladores | `backend/src/controllers` | Validan la entrada, aplican las reglas y arman la respuesta |
| Modelos | `backend/src/models` | Definición de tablas y relaciones (`associations.js`) |
| Utilidades | `backend/src/utils` | Funciones puras reutilizables: validaciones, hash de contraseñas, cálculo del estado de membresía |
| Configuración | `backend/src/config` | Base de datos, autenticación, migrador |
| Migraciones | `backend/migrations` | Historial versionado del esquema |

## Estructura del frontend

| Carpeta | Contenido |
|:-|:-|
| `src/pages` | Una carpeta por pantalla (`Clientes`, `Membresias`, `Rutinas`, `Cliente/MiMembresia`, …) |
| `src/components` | Componentes por dominio (`cliente`, `membresia`, `rutina`, `auth`, `layout`, `ui`) |
| `src/services` | Una función por endpoint (axios con `withCredentials`) |
| `src/models` | Tipos TypeScript de lo que devuelve la API |
| `src/context` + `src/hooks` | Sesión (`AuthProvider`, `useAuth`) y carga de datos (`useAsyncData`) |
| `src/routes` | Rutas por rol, protegidas con `ProtectedRoute` |
| `src/utils` | Formato de fechas/importes, navegación por rol, etc. |

## Modelo de datos

Diagrama entidad-relación **generado desde el esquema real** de PostgreSQL (se aplican todas las migraciones a una base limpia y se lee el resultado), así que tablas, columnas, tipos y claves coinciden con la base. `FK` es clave foránea, `UK` único y, entre paréntesis, la acción `ON DELETE` (sin acción: `NO ACTION`).

```mermaid
erDiagram
    clientes |o--o{ InscripcionTurno : "dniCliente (CASCADE)"
    Turnos ||--o{ InscripcionTurno : "idTurno"
    clientes ||--o{ Membresias : "dniCliente (CASCADE)"
    Profesores ||--o{ ProfesorEspecialidad : "dniProfesor (CASCADE)"
    Especialidades ||--o{ ProfesorEspecialidad : "idEspecialidad (CASCADE)"
    Rutinas ||--o{ RutinaEjercicios : "idRutina (CASCADE)"
    clientes ||--o{ Rutinas : "dniCliente (CASCADE)"
    Profesores ||--o{ Rutinas : "dniProfesor"
    Profesores |o--o{ TurnoProfesores : "dniProfesor"
    Turnos ||--o{ TurnoProfesores : "idTurno (CASCADE)"
    TiposClase ||--o{ Turnos : "idClase"
    Turnos |o--o{ Turnos : "idTurnoPlantilla (SET NULL)"
    Profesores |o--o| Usuarios : "dniProfesor (RESTRICT)"
    Usuarios ||--o| clientes : "idUsuario (RESTRICT)"

    Especialidades {
        integer id PK
        varchar_255 nombre
        timestamptz createdAt
        timestamptz updatedAt
    }

    InscripcionTurno {
        bigint idInscripcion PK
        bigint idTurno FK
        integer dniCliente FK
        timestamptz fechaHoraInscripcion
        text estado
        timestamptz createdAt
        timestamptz updatedAt
    }

    Membresias {
        bigint idMembresia PK
        integer dniCliente FK
        date fechaPago
        date fechaInicio
        date fechaVencimiento
        numeric_10_2 valor
        timestamptz createdAt
        timestamptz updatedAt
    }

    ProfesorEspecialidad {
        integer dniProfesor PK,FK
        integer idEspecialidad PK,FK
    }

    Profesores {
        integer dni PK
        varchar_255 nombre
        varchar_255 apellido
        varchar_255 telefono
        varchar_255 email
        timestamptz createdAt
        timestamptz updatedAt
    }

    RutinaEjercicios {
        bigint id PK
        bigint idRutina FK
        text nombreEjercicio
        integer series
        text repeticiones
        smallint descanso
        timestamptz createdAt
        timestamptz updatedAt
    }

    Rutinas {
        bigint idRutina PK
        text nombreRutina
        text diaSemana
        integer dniCliente FK
        integer dniProfesor FK
        timestamptz createdAt
        timestamptz updatedAt
    }

    TiposClase {
        bigint idClase PK
        text nombre
        text descripcion
        timestamptz createdAt
        timestamptz updatedAt
    }

    TurnoProfesores {
        bigint id PK
        bigint idTurno FK
        integer dniProfesor FK
        timestamptz createdAt
        timestamptz updatedAt
    }

    Turnos {
        bigint idTurno PK
        bigint idClase FK
        date fecha
        time horaInicio
        time horaFin
        integer capacidadMaxima
        text estado
        bigint idTurnoPlantilla FK
        timestamptz createdAt
        timestamptz updatedAt
    }

    Usuarios {
        integer id PK
        varchar_255 email UK
        varchar_255 passwordHash
        enum rol
        boolean activo
        integer tokenVersion
        boolean debeCambiarPassword
        integer dniProfesor FK,UK
        timestamptz createdAt
        timestamptz updatedAt
    }

    clientes {
        integer dni PK
        varchar_100 nombre
        varchar_100 apellido
        varchar_30 telefono
        varchar_100 email
        boolean estado
        integer idUsuario FK,UK
        timestamptz createdAt
        timestamptz updatedAt
    }
```

### Reglas de borrado

| Al borrar… | Pasa con… |
|:-|:-|
| un **cliente** | se borran sus membresías, sus rutinas (con sus ejercicios) y su cuenta. El frontend pide confirmación antes |
| un **profesor** sin rutinas | se borra con su cuenta |
| un **profesor con rutinas** | se rechaza con `409`: las rutinas también son del cliente |
| una **rutina** | se borran sus ejercicios |
| un **cliente** con inscripciones | se borran también sus inscripciones |
| un **profesor asignado a turnos** | se rechaza con `409` |
| un **tipo de clase con turnos** | se rechaza con `409` |
| un **turno con inscripciones** | se rechaza con `409` |

### Lo que no se guarda: el estado de la membresía

El estado (`Pendiente`, `Activa`, `Por vencer`, `Vencida`) se **calcula** al responder a partir de `fechaInicio` y `fechaVencimiento` y de la fecha de hoy en Argentina. Así nunca queda desactualizado y no hace falta un proceso que lo actualice.

```mermaid
flowchart TD
    A{fechaVencimiento < hoy?} -->|sí| V[Vencida]
    A -->|no| B{fechaInicio > hoy?}
    B -->|sí| P[Pendiente]
    B -->|no| C{vence en 7 días o menos?}
    C -->|sí| X[Por vencer]
    C -->|no| Ac[Activa]
```

### Clases y turnos

Un **tipo de clase** tiene **turnos**; un turno tiene uno o más **profesores** y recibe **inscripciones** de clientes. Un turno sin fecha es una **plantilla**: el backend genera a partir de ella los turnos de los próximos 30 días, y cada turno generado recuerda su plantilla (`idTurnoPlantilla`) para que editar uno actualice toda la serie.

```mermaid
flowchart LR
    P[Plantilla<br/>turno sin fecha] -->|genera cada día| T[Turnos de los próximos 30 días]
    T --> I{Cliente se inscribe}
    I -->|"membresía que cubre el día · ≥ 8 h antes · 1 por día · hay lugar · sin bloqueo por ausencias"| OK[Inscripción activa]
    I -->|no cumple| X[409 con el motivo]
    OK -->|el día del turno| A[Profesor marca<br/>asistió / ausente]
    OK -->|el cliente cancela| C[Cancelada<br/>libera el lugar]
    A -->|"3 ausencias en 30 días"| B[7 días sin poder reservar]
```

Los **strikes** tampoco se guardan: se cuentan las inscripciones `ausente` de los turnos recientes (`utils/strikes.js`), igual que el estado de la membresía se calcula de sus fechas.
