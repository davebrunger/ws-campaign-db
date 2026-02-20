const createMigrationTable = `
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at INTEGER NOT NULL
    );
`

const getMigrations = "SELECT name FROM __drizzle_migrations";

const addMigration = "INSERT INTO __drizzle_migrations (name, applied_at) VALUES (?, strftime('%s','now'))";

export async function loadMigrations() {
    const modules = import.meta.glob("/drizzle/*.sql", {
        query: "raw",
        import: "default",
        eager: true,
    });

    const entries = Object.entries(modules)
        .sort(([a], [b]) => a.localeCompare(b));

    return entries.map(([name, sql]) => ({
        name,
        sql : sql as string
    }));
}

export async function applymigrations(promiser: Sqlite3Worker1Promiser, dbId: string) {
        await promiser("exec", {dbId, sql : createMigrationTable});
        const {result} = await promiser("exec", {dbId, sql : getMigrations, returnValue : "resultRows"});
        const applied = new Set((result.resultRows as any []).map(r => r[0] as string));
        const migrations = await loadMigrations()
        for (const m of migrations) {
            if (applied.has(m.name)) {
                continue;
            }
            console.log("Applying migration", m.name);
            await promiser("exec", {dbId, sql : "BEGIN"});
            try {
                await promiser("exec", {dbId, sql : m.sql});
                await promiser("exec", {dbId, sql : addMigration, bind : [m.name]});
                await promiser("exec", {dbId, sql : "COMMIT"});
            }
            catch (e) {
                await promiser("exec", {dbId, sql : "ROLLBACK"});
                throw e;
            }
        }
    }
