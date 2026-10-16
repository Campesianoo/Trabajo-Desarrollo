# API

API REST en JSON, todo bajo el prefijo `/api`. En desarrollo: `http://localhost:3000/api`.

Hay una colección de requests lista para usar con [Bruno](https://www.usebruno.com) en [`api-tests/Gym API`](../api-tests/Gym%20API).

## Convenciones

- **Autenticación:** cookie `token` (httpOnly) que se setea con `POST /api/auth/login`. El cliente HTTP tiene que enviar las cookies (`withCredentials: true` en axios, `credentials: 'include'` en fetch).
- **CSRF:** los métodos `POST`, `PUT`, `PATCH` y `DELETE` que traen un header `Origin` distinto de `FRONTEND_ORIGIN` reciben `403`.
- **Errores:** siempre `{ "message": "texto para mostrar" }`. En desarrollo puede sumar `error` con el detalle interno; en producción nunca.
- **Fechas:** `AAAA-MM-DD`. **Ids y DNI:** enteros positivos.
- **Límite del body:** 10 KB.

### Códigos de estado

| Código | Cuándo |
|:-:|:-|
| 200 / 201 / 204 | Éxito / creado / borrado |
| 400 | Dato inválido o faltante (el `message` dice cuál) |
| 401 | Sin sesión, sesión vencida, cuenta desactivada o credenciales incorrectas |
| 403 | El rol no tiene permiso, o el origen no está permitido |
| 404 | No existe |
| 409 | Conflicto: DNI o email repetido, o no se puede borrar porque tiene registros asociados |
| 429 | Demasiados intentos de login (10 cada 15 minutos por IP) |

## Roles

| Rol | Puede |
|:-|:-|
| `admin` | Todo |
| `profesor` | Consultar profesores, especialidades y clientes; crear, editar y borrar rutinas; ver su perfil |
| `cliente` | Consultar profesores y especialidades; ver y editar (solo el teléfono) su perfil; ver sus rutinas y sus membresías |

El profesor **no** ve las membresías, ni siquiera el estado en el listado de clientes.

## Autenticación

| Método | Ruta | Acceso | Body / respuesta |
|:-|:-|:-|:-|
| POST | `/auth/login` | Público | `{ email, password }` → `{ id, email, rol, dniProfesor, debeCambiarPassword }` + cookie |
| POST | `/auth/logout` | Público | Borra la cookie |
| GET | `/auth/me` | Autenticado | El usuario de la sesión. El frontend lo usa al cargar para restaurarla |
| PUT | `/auth/password` | Autenticado | `{ passwordActual, passwordNueva }` (8 a 72 caracteres). Invalida las sesiones anteriores |

`debeCambiarPassword: true` significa que la cuenta sigue con la contraseña que le dio el admin; el frontend se lo recuerda al usuario. No bloquea nada.

## Usuarios (solo admin)

| Método | Ruta | Body |
|:-|:-|:-|
| GET | `/usuarios`, `/usuarios/:id` | |
| POST | `/usuarios` | `{ email, password, rol, dniProfesor? }` |
| PUT | `/usuarios/:id` | `{ rol?, activo?, password? }` |
| DELETE | `/usuarios/:id` | |

Un admin no puede borrarse, desactivarse ni quitarse el rol a sí mismo.

## Clientes

| Método | Ruta | Acceso | Body |
|:-|:-|:-|:-|
| GET | `/clientes/me` | Cliente | Su propio perfil |
| PUT | `/clientes/me` | Cliente | `{ telefono }` (solo ese campo) |
| GET | `/clientes` | Admin, profesor | Lista. **Solo para el admin** cada cliente trae `membresia` (ver abajo) |
| GET | `/clientes/:dni` | Admin, profesor | Un cliente (también con `membresia` para el admin) |
| POST | `/clientes` | Admin | `{ dni, nombre, apellido, email, telefono?, estado? }`. **Crea también su cuenta** (contraseña inicial: el DNI) |
| PUT | `/clientes/:dni` | Admin | `{ nombre?, apellido?, telefono?, email?, estado?, activo?, password? }` |
| DELETE | `/clientes/:dni` | Admin | Borra también membresías, rutinas y cuenta |

Cada cliente se devuelve así:

```json
{
  "dni": 40123456,
  "nombre": "Ana",
  "apellido": "Gómez",
  "telefono": "3411234567",
  "email": "ana@correo.com",
  "estado": true,
  "activo": true,
  "debeCambiarPassword": true,
  "membresia": { "fechaInicio": "2026-10-01", "fechaVencimiento": "2026-12-31", "estado": "Activa" }
}
```

`membresia` es la que está en curso (`Activa` o `Por vencer`); si no hay, la próxima (`Pendiente`); si no, la última (`Vencida`); y `null` si el cliente nunca tuvo una. El campo no existe en la respuesta al profesor.

## Profesores

| Método | Ruta | Acceso | Body |
|:-|:-|:-|:-|
| GET | `/profesores`, `/profesores/:dni` | Autenticado | |
| POST | `/profesores` | Admin | `{ dni, nombre, apellido, telefono, email }`. Crea también su cuenta (contraseña inicial: el DNI) |
| PUT | `/profesores/:dni` | Admin | Campos a modificar |
| DELETE | `/profesores/:dni` | Admin | Borra también su cuenta. `409` si tiene rutinas |
| POST | `/profesores/:dni/especialidades` | Admin | `{ idEspecialidad }` |
| DELETE | `/profesores/:dni/especialidades/:idEspecialidad` | Admin | |

## Especialidades

| Método | Ruta | Acceso | Body |
|:-|:-|:-|:-|
| GET | `/especialidades`, `/especialidades/:id` | Autenticado | |
| POST | `/especialidades` | Admin | `{ nombre }` |
| PUT | `/especialidades/:id` | Admin | `{ nombre }` |
| DELETE | `/especialidades/:id` | Admin | |

## Membresías

Cada pago de un cliente es una membresía. El **estado se calcula** y viene en la respuesta (ver [arquitectura](arquitectura.md#lo-que-no-se-guarda-el-estado-de-la-membresía)).

| Método | Ruta | Acceso | Body |
|:-|:-|:-|:-|
| GET | `/membresias` | Admin (todas), cliente (solo las suyas) | |
| GET | `/membresias/:id` | Admin, cliente (solo las suyas) | |
| GET | `/membresias/cliente/:dni` | Admin | |
| POST | `/membresias` | Admin | `{ dniCliente, fechaPago, fechaInicio, fechaVencimiento, valor }` |
| PUT | `/membresias/:id` | Admin | Cualquiera de las fechas o `valor` (el cliente no se puede cambiar) |
| DELETE | `/membresias/:id` | Admin | |

`valor` va de 0 a 99999999.99; las fechas tienen que existir (`2026-02-30` se rechaza) y `fechaInicio` no puede ser posterior a `fechaVencimiento`.

## Rutinas

| Método | Ruta | Acceso | Body |
|:-|:-|:-|:-|
| GET | `/rutinas`, `/rutinas/:id` | Autenticado, filtrado por rol: admin todas, profesor las suyas, cliente las propias | |
| POST | `/rutinas` | Admin, profesor | `{ nombreRutina, diaSemana, dniCliente, dniProfesor, ejercicios: [{ nombreEjercicio, series, repeticiones, descanso }] }` |
| PUT | `/rutinas/:id` | Admin, profesor | Campos de la rutina y/o la lista completa de `ejercicios` |
| DELETE | `/rutinas/:id` | Admin, profesor | Borra también sus ejercicios |
| POST | `/rutinas/:id/ejercicios` | Admin, profesor | Un ejercicio |
| PUT | `/rutinas/:id/ejercicios/:idEjercicio` | Admin, profesor | |
| DELETE | `/rutinas/:id/ejercicios/:idEjercicio` | Admin, profesor | |

El cliente y el profesor de una rutina tienen que existir; si no, `400`.

## Clases y turnos

Pendiente: se documenta cuando se integre la rama que los implementa (ver [seguimiento](seguimiento.md)).
