import * as React from 'react';
import { Table } from 'react-bootstrap';
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

export function NodeTable(props: Props) {

    const client = useClient({ databaseName: props.databaseName, migrations: loadMigrations });
    const db = React.useMemo(() => drizzle(client.exec), [client]);
    const displayColumns = React.useMemo(
        () => Object.keys(getTableColumns(nodesTable))
            .filter((column) => column !== "id" && column !== "type") as Array<keyof Omit<Node, "id" | "type">>,
        []
    );

    const [nodes, setNodes] = React.useState<Node[] | undefined>(undefined);

    const updateNodes = React.useCallback(async () => {
        const newNodes = await db.select().from(nodesTable).where(eq(nodesTable.type, props.type));
        setNodes(newNodes);
    }, [db, props.type]);

    const addNode = React.useCallback(async (node: Node) => {
        await db.insert(nodesTable).values(node);
        await updateNodes();
        return true;
    }, [db, updateNodes]);

    React.useEffect(() => {
        void updateNodes();
    }, [updateNodes]);

    return (
        <Table size='sm'>
            <thead>
                <tr>
                    {displayColumns
                        .map((column) => (
                            <th key={column}>{column}</th>
                        ))}
                </tr>
            </thead>
            <tbody>
                <AddNodeRow type={props.type} addNode={addNode} />
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
    );
}