import * as React from 'react';
import { Alert, Table } from 'react-bootstrap';
import { nodesTable, type Node } from '../db/schema';
import { getTableColumns } from 'drizzle-orm';
import { useClient } from '@whitstable-software/sqlite-opfs';
import { loadMigrations } from '../db/migrations';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { eq } from 'drizzle-orm';
import { AddNodeRow } from './addNodeRow';

type Props = {
    readonly databaseName: string,
    readonly type: string
}

function toTitleCase(columnName: string): string {
    return columnName
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

export function NodeTable(props: Props) {

    const client = useClient({ databaseName: props.databaseName, migrations: loadMigrations });
    const db = React.useMemo(() => drizzle(client.exec), [client]);
    const displayColumns = React.useMemo(
        () => Object.keys(getTableColumns(nodesTable))
            .filter((column) => column !== "id" && column !== "type") as Array<keyof Omit<Node, "id" | "type">>,
        []
    );

    const [nodes, setNodes] = React.useState<Node[] | undefined>(undefined);
    const [errorMessage, setErrorMessage] = React.useState<string | undefined>(undefined);

    function getNodeErrorMessage(error: unknown): string {
        const message = error instanceof Error ? error.message.toLowerCase() : "";
        if (message.includes("unique") || message.includes("constraint") || message.includes("node_ux")) {
            return "A node with that name already exists for this type.";
        }
        return "Could not save node. Please try again.";
    }

    const updateNodes = React.useCallback(async () => {
        const newNodes = await db.select().from(nodesTable).where(eq(nodesTable.type, props.type));
        setNodes(newNodes);
    }, [db, props.type]);

    const addNode = React.useCallback(async (node: Node) => {
        try {
            await db.insert(nodesTable).values(node);
            setErrorMessage(undefined);
            await updateNodes();
            return true;
        } catch (error) {
            setErrorMessage(getNodeErrorMessage(error));
            return false;
        }
    }, [db, updateNodes]);

    React.useEffect(() => {
        void updateNodes();
    }, [updateNodes]);

    return (
        <>
            {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
            <Table size='sm'>
                <thead>
                    <tr>
                        {displayColumns
                            .map((column) => (
                                <th key={column}>{toTitleCase(String(column))}</th>
                            ))}
                    </tr>
                </thead>
                <tbody>
                    <AddNodeRow type={props.type} addNode={addNode} clearError={() => setErrorMessage(undefined)} />
                    {nodes?.map((node) => (
                        <tr key={node.id}>
                            {displayColumns
                                .map((column) => (
                                    <td key={column}>{node[column]}</td>
                                ))}
                        </tr>
                    ))}
                </tbody>
            </Table>
        </>
    );
}