import { edgesTable, type Edge } from './schema';

export function getEdgeTypeValidationMessage(type: string): string | undefined {
    if (type.trim().length === 0) {
        return 'Edge type is required.';
    }
    return undefined;
}

export function getEdgeSaveErrorMessage(error: unknown): string {
    const message = error instanceof Error ? error.message.toLowerCase() : '';
    if (message.includes('edge_type_non_empty') || message.includes('check constraint')) {
        return 'Edge type is required.';
    }
    if (message.includes('constraint') || message.includes('foreign key')) {
        return 'Could not save edge. Please verify the selected nodes and try again.';
    }
    return 'Could not save edge. Please try again.';
}

type InsertEdgeDb = {
    insert: (table: typeof edgesTable) => {
        values: (value: Edge) => Promise<unknown>
    }
};

export async function insertEdge(db: InsertEdgeDb, edge: Edge): Promise<string | undefined> {
    const typeError = getEdgeTypeValidationMessage(edge.type);
    if (typeError) {
        return typeError;
    }

    const normalizedEdge: Edge = {
        ...edge,
        type: edge.type.trim(),
    };

    try {
        await db.insert(edgesTable).values(normalizedEdge);
        return undefined;
    } catch (error) {
        return getEdgeSaveErrorMessage(error);
    }
}
