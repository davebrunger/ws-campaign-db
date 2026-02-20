import { sqlite3Worker1Promiser } from "@sqlite.org/sqlite-wasm";
import React from "react";
import { applymigrations } from "./migrations";
import { buildBackupDbUri, buildDbUri } from "./databaseNameUtilities";

type ExecMethod = 'run' | 'all' | 'values' | 'get';
type ExecResult = { rows: any[] };
type SqlValue = any;

type ClientConfig = {
    readonly databaseName: string;
    readonly initSql: string | string[];
};

export type DbHandle = {
    readonly promiser: Sqlite3Worker1Promiser;
    readonly dbId: string;
    readonly databaseName : string
}

function normaliseSql(sql?: string | string[]) {
    if (!sql) {
        return [];
    }
    return Array.isArray(sql) ? sql : [sql];
}

export type DbClient = {
    readonly openDb : () => Promise<DbHandle>;
    readonly exec : (sql : string, params : any[], method : ExecMethod) => Promise<ExecResult>;
    readonly close : () => Promise<void>; 
    readonly vaccuumInto : (targetDatabaseName : string) => Promise<void>
    readonly switchDb : (newConfig : ClientConfig) => Promise<void>
}

export function useClient(initial: ClientConfig) : DbClient {

    const config = React.useRef(initial);
    const handle = React.useRef<DbHandle | undefined>(undefined);
    const openingHandle = React.useRef<Promise<DbHandle> | undefined>(undefined);
    const worker = React.useRef<Worker | undefined>(undefined)

    React.useEffect(() => {
        config.current = initial;
    }, [initial.databaseName, initial.initSql]);

    const openDb = React.useCallback(async (): Promise<DbHandle> => {

        if (handle.current) {
            return handle.current;
        }
        if (openingHandle.current) {
            return openingHandle.current
        }

        openingHandle.current = (async () => {
            // Avoids potential timing issues
            // Just using:
            //     const promiser = sqlite3Worker1Promiser();
            // Can cause problems on slower machines
            const promiser: Sqlite3Worker1Promiser = await new Promise((resolve, reject) => {
                const p = sqlite3Worker1Promiser({
                    onready: () => resolve(p as any),
                    onerror: (e: any) => reject(e),
                });
                worker.current = (p as any).worker ?? worker.current;
            });

            const { databaseName, initSql } = config.current;

            const openResult = await promiser("open", { filename: buildDbUri(databaseName) });
            const dbId = openResult.dbId;

            await applymigrations(promiser, dbId);

            for (const sql of normaliseSql(initSql)) {
                if (sql.trim()) {
                    await promiser("exec", { dbId, sql });
                }
            }
            const newHandle = { promiser, dbId, databaseName };
            handle.current = newHandle;
            return newHandle;
        })();

        try {
            return await openingHandle.current;
        }
        catch (e: any) {
            openingHandle.current = undefined;
            throw e;
        }
    }, []);

    const exec = React.useCallback(async (sql: string, params: SqlValue[], method: ExecMethod): Promise<ExecResult> => {
        const { promiser, dbId } = await openDb();
        const returnValue = method === "all" ? "resultRows" : undefined;
        const execResult = await promiser("exec", { dbId, sql, bind: params, returnValue });
        const rows: any[] = method === "all" ? (execResult?.result?.resultRows ?? []) : [];
        return { rows };
    }, [openDb]);

    const close = React.useCallback(async () => {
        const currentHandle = handle.current ?? (openingHandle.current
            ? await openingHandle.current.catch(() => undefined)
            : undefined);
        openingHandle.current = undefined;

        if (currentHandle) {
            try {
                await currentHandle.promiser("close", { dbId: currentHandle.dbId });
            } finally {
                handle.current = undefined;
            }
        }

        if (worker.current) {
            worker.current.terminate();
            worker.current = undefined;
        }

    }, []);

    const vaccuumInto = React.useCallback(async (targetDatabaseName: string) => {
        const { promiser, dbId } = await openDb();
        const sql = `VACUUM INTO ${buildBackupDbUri(targetDatabaseName)}`;
        await promiser("exec", { dbId, sql });
    }, [openDb]);

    const switchDb = React.useCallback(async (newConfig: ClientConfig) => {
        await close();
        config.current = newConfig;
    }, [close])

    return { openDb, exec, close, vaccuumInto, switchDb };
}