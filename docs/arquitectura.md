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

```mermaid
erDiagram
    Usuarios ||--o| clientes : "idUsuario"
    Usuarios ||--o| Profesores : "dniProfesor"
    Profesores }o--o{ Especialidades : "ProfesorEspecialidad"
    clientes ||--o{ Membresias : "dniCliente (CASCADE)"
    clientes ||--o{ Rutinas : "dniCliente (CASCADE)"
    Profesores ||--o{ Rutinas : "dniProfesor (NO ACTION)"
    Rutinas ||--o{ RutinaEjercicios : "idRutina (CASCADE)"

    Usuarios {
        int id PK
        string email UK
        string passwordHash
        enum rol "admin, profesor, cliente"
        bool activo
        int tokenVersion
        bool debeCambiarPassword
        int dniProfesor FK
    }
    clientes {
        int dni PK
        string nombre
        string apellido
        string telefono
        string email
        bool estado
        int idUsuario FK
    }
    Profesores {
        int dni PK
        string nombre
        string apellido
        string telefono
        string email
    }
    Especialidades {
        int id PK
        string nombre
    }
    Membresias {
        bigint idMembresia PK
        int dniCliente FK
        date fechaPago
        date fechaInicio
        date fechaVencimiento
        decimal valor
    }
    Rutinas {
        int idRutina PK
        string nombreRutina
        string diaSemana
        int dniCliente FK
        int dniProfesor FK
    }
    RutinaEjercicios {
        int id PK
        int idRutina FK
        string nombreEjercicio
        int series
        string repeticiones
        int descanso
    }
```

### Reglas de borrado

| Al borrar… | Pasa con… |
|:-|:-|
| un **cliente** | se borran sus membresías, sus rutinas (con sus ejercicios) y su cuenta. El frontend pide confirmación antes |
| un **profesor** sin rutinas | se borra con su cuenta |
| un **profesor con rutinas** | se rechaza con `409`: las rutinas también son del cliente |
| una **rutina** | se borran sus ejercicios |

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

### Clases y turnos (en desarrollo)

Las tablas de clases las está desarrollando otro integrante en su rama: `TiposClase`, `Turnos`, `TurnoProfesores` e `InscripcionTurno`. Cuando se integren se agregan a este diagrama. Ver [migraciones](migraciones.md#ramas-que-agregan-tablas).
