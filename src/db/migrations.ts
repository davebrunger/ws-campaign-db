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