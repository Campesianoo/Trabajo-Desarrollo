module.exports = {
  up: async ({ context: queryInterface }) => {
    const sequelize = queryInterface.sequelize;
    await sequelize.query(`
      ALTER TABLE "Turnos"
      ADD COLUMN IF NOT EXISTS "idTurnoPlantilla" BIGINT
    `);
    await sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'Turnos_idTurnoPlantilla_fkey'
        ) THEN
          ALTER TABLE "Turnos"
            ADD CONSTRAINT "Turnos_idTurnoPlantilla_fkey"
            FOREIGN KEY ("idTurnoPlantilla") REFERENCES "Turnos" ("idTurno")
            ON DELETE SET NULL;
        END IF;
      END $$;
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS "Turnos_idTurnoPlantilla_idx"
      ON "Turnos" ("idTurnoPlantilla")
    `);
  },

  down: async ({ context: queryInterface }) => {
    const sequelize = queryInterface.sequelize;
    await sequelize.query('DROP INDEX IF EXISTS "Turnos_idTurnoPlantilla_idx"');
    await sequelize.query(`
      ALTER TABLE "Turnos"
      DROP CONSTRAINT IF EXISTS "Turnos_idTurnoPlantilla_fkey"
    `);
    await sequelize.query('ALTER TABLE "Turnos" DROP COLUMN IF EXISTS "idTurnoPlantilla"');
  }
};
