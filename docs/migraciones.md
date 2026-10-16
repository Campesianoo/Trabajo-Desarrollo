# Migraciones

El esquema de la base se maneja con migraciones ([Umzug](https://github.com/sequelize/umzug)) en `backend/migrations`. El servidor **aplica las pendientes al arrancar**, así que en el deploy no hay que hacer nada extra.

| Comando (en `backend/`) | Qué hace |
|:-|:-|
| `pnpm run migrate` | Aplica las migraciones pendientes |
| `pnpm run migrate:status` | Muestra cuáles están aplicadas y cuáles pendientes |
| `pnpm run migrate:down` | Revierte la última (la del esquema inicial no se puede revertir) |

Cuáles están aplicadas se guarda en la tabla `SequelizeMeta` de la propia base.

## Cómo cambiar el esquema

1. Crear un archivo nuevo en `backend/migrations` con el formato `AAAAMMDD-NN-descripcion.js`. Se aplican en orden alfabético. Tiene que exportar `up` y `down`.
2. Actualizar el modelo de Sequelize para que coincida con la migración.
3. **No editar una migración que ya se aplicó**: si hay que corregir algo, se hace con otra migración nueva.

Ejemplo (`20261017-02-cliente-borra-rutinas.js`, cambia una restricción):

```js
module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE "Rutinas"
        DROP CONSTRAINT "Rutinas_dniCliente_fkey",
        ADD CONSTRAINT "Rutinas_dniCliente_fkey" FOREIGN KEY ("dniCliente")
          REFERENCES clientes(dni) ON UPDATE NO ACTION ON DELETE CASCADE
    `);
  },
  down: async ({ context: queryInterface }) => {
    // ...vuelve a ON DELETE NO ACTION
  }
};
```

## Desarrollar contra una base propia

**No desarrollar ramas con cambios de esquema contra la base compartida de Supabase.** Correr una rama así modifica la base para todos: así quedaron duplicadas las tablas `Membresia` y `membresia`.

Para una base local alcanza con un PostgreSQL instalado y estas variables en el `.env` en lugar de `DATABASE_URL`: `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_HOST` y `DB_PORT`. Al arrancar, las migraciones crean todas las tablas.

## Ramas que agregan tablas

**Regla:** toda rama que agregue o cambie tablas **tiene que traer su propia migración**. Sin ella, quien levante el proyecto desde cero no tiene esas tablas, y el que usó la base compartida ve cosas que nadie más puede reproducir.

Caso concreto: las tablas de clases (`TiposClase`, `Turnos`, `TurnoProfesores`, `InscripcionTUrno`) **ya existen en Supabase** porque se crearon al correr esa rama contra la base compartida, pero no tienen migración. Por eso su migración tiene que ser **idempotente**: usar `IF NOT EXISTS`, así corre sin error tanto donde las tablas ya existen (Supabase) como en una base vacía (cualquier otro).

Ejemplo de la forma que debería tener:

```js
// 20261020-01-clases-y-turnos.js
module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "TiposClase" (
        "idClase"     SERIAL PRIMARY KEY,
        "nombre"      VARCHAR(100) NOT NULL,
        "descripcion" TEXT
      );
      CREATE TABLE IF NOT EXISTS "Turnos" (
        "idTurno"         SERIAL PRIMARY KEY,
        "idClase"         INTEGER NOT NULL REFERENCES "TiposClase"("idClase"),
        "fecha"           DATE NOT NULL,
        "horaInicio"      TIME NOT NULL,
        "horaFin"         TIME NOT NULL,
        "capacidadMaxima" INTEGER NOT NULL,
        "estado"          VARCHAR(30) NOT NULL
      );
    `);
  },
  down: async ({ context: queryInterface }) => {
    await queryInterface.sequelize.query(`DROP TABLE IF EXISTS "Turnos", "TiposClase" CASCADE`);
  }
};
```

> El SQL exacto tiene que coincidir con los modelos de esa rama (nombres de columnas, tipos, claves foráneas). El ejemplo muestra la forma, no el contenido definitivo.
