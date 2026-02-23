import * as React from 'react';
import { Alert, Table } from 'react-bootstrap';
import { edgesTable, nodesTable, type Node } from '../db/schema';
import { aliasedTable, and, asc, eq, getTableColumns, or, sql } from 'drizzle-orm';
import { useClient } from '@whitstable-software/sqlite-opfs';
import { loadMigrations } from '../db/migrations';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { AddNodeRow } from './addNodeRow';
import { Link } from 'react-router';
import { insertEdge } from '../db/edges';

type Props = {
    readonly databaseName: string,
    readonly type: string,
    readonly getNodeLink?: (node: Node) => string | undefined,
    readonly edgeConfig?: {
        readonly edgeType: string,
        readonly targetNodeType: string
    }
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
    const db = React.useMemo(() => drizzle(client.exec), [props.databaseName]);
    const displayColumns = React.useMemo(
        () => Object.keys(getTableColumns(nodesTable))
            .filter((column) => column !== "id" && column !== "type") as Array<keyof Omit<Node, "id" | "type">>,
        []
    );

    const [nodes, setNodes] = React.useState<Array<{ node: Node, edgeName: string | null }> | undefined>(undefined);
    const [targetNodeOptions, setTargetNodeOptions] = React.useState<Array<{ id: number, label: string }>>([]);
    const [errorMessage, setErrorMessage] = React.useState<string | undefined>(undefined);
    const edgeConfig = props.edgeConfig;

    function getNodeErrorMessage(error: unknown): string {
        const message = error instanceof Error ? error.message.toLowerCase() : "";
        if (message.includes("unique") || message.includes("constraint") || message.includes("node_ux")) {
            return "A node with that name already exists for this type.";
        }
        return "Could not save node. Please try again.";
    }

    const updateNodes = React.useCallback(async () => {
        if (!edgeConfig) {
            const newNodes = await db
                .select({ node: nodesTable, edgeName: sql<string | null>`NULL` })
                .from(nodesTable)
                .where(eq(nodesTable.type, props.type));
            setNodes(newNodes);
            setTargetNodeOptions([]);
            return;
        }

        const selectableNodes = await db
            .select({ id: nodesTable.id, name: nodesTable.name, type: nodesTable.type })
            .from(nodesTable)
            .where(eq(nodesTable.type, edgeConfig.targetNodeType))
            .orderBy(asc(nodesTable.type), asc(nodesTable.name));

        setTargetNodeOptions(selectableNodes.map((node) => ({ id: node.id, label: `${node.name} (${node.type})` })));

        const relatedEdges = aliasedTable(edgesTable, 'relatedEdges');
        const relatedNodes = aliasedTable(nodesTable, 'relatedNodes');

        const newNodes = await db
            .select({
                node: nodesTable,
                edgeName: sql<string | null>`min(${relatedNodes.name})`,
            })
            .from(nodesTable)
            .leftJoin(
                relatedEdges,
                and(
                    eq(relatedEdges.type, edgeConfig.edgeType),
                    or(
                        eq(relatedEdges.fromId, nodesTable.id),
                        eq(relatedEdges.toId, nodesTable.id)
                    )
                )
            )
            .leftJoin(
                relatedNodes,
                or(
                    and(
                        eq(relatedEdges.fromId, nodesTable.id),
                        eq(relatedNodes.id, relatedEdges.toId)
                    ),
                    and(
                        eq(relatedEdges.toId, nodesTable.id),
                        eq(relatedNodes.id, relatedEdges.fromId)
                    )
                )
            )
            .where(eq(nodesTable.type, props.type))
            .groupBy(nodesTable.id, nodesTable.type, nodesTable.name, nodesTable.summary);

        setNodes(newNodes);

    }, [db, edgeConfig, props.type]);

    const addNode = React.useCallback(async (node: Node, targetNodeId?: number) => {
        const normalizedNode: Node = {
            ...node,
            name: node.name.trim(),
            summary: node.summary.trim(),
        };

        try {
            await db.insert(nodesTable).values(normalizedNode);

            if (edgeConfig && targetNodeId !== undefined) {
                const insertedNodeRows = await db
                    .select({ id: nodesTable.id })
                    .from(nodesTable)
                    .where(and(eq(nodesTable.type, normalizedNode.type), eq(nodesTable.name, normalizedNode.name)));

                const insertedNodeId = insertedNodeRows[0]?.id;
                if (insertedNodeId === undefined) {
                    setErrorMessage('Could not save edge. Could not resolve new node id.');
                    return false;
                }

                const edgeError = await insertEdge(db, {
                    fromId: insertedNodeId,
                    toId: targetNodeId,
                    type: edgeConfig.edgeType,
                });

                if (edgeError) {
                    setErrorMessage(edgeError);
                    return false;
                }
            }

            setErrorMessage(undefined);
            await updateNodes();
            return true;
        } catch (error) {
            setErrorMessage(getNodeErrorMessage(error));
            return false;
        }
    }, [db, edgeConfig, updateNodes]);

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
                        {edgeConfig && <th>{toTitleCase(String(edgeConfig.edgeType))}</th>}
                        <th>&nbsp;</th>
                    </tr>
                </thead>
                <tbody>
                    <AddNodeRow
                        type={props.type}
                        addNode={addNode}
                        clearError={() => setErrorMessage(undefined)}
                        targetNodeLabel={edgeConfig ? toTitleCase(edgeConfig.edgeType) : undefined}
                        targetNodeOptions={edgeConfig ? targetNodeOptions : undefined}
                    />
                    {nodes?.map((node) => (
                        <tr key={node.node.id}>
                            {displayColumns
                                .map((column) => (
                                    <td key={column}>
                                        {column === "name" && props.getNodeLink
                                            ? (() => {
                                                const link = props.getNodeLink?.(node.node);
                                                if (!link) {
                                                    return node.node[column];
                                                }
                                                return <Link to={link}>{node.node[column]}</Link>;
                                            })()
                                            : node.node[column]}
                                    </td>
                                ))}
                            {edgeConfig && (
                                <td>{node.edgeName ?? ""}</td>
                            )}
                            <td>&nbsp;</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </>
    );
}