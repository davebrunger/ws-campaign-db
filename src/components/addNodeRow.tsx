import React from "react";
import { Button, Form } from "react-bootstrap";
import { nodesTable, type Node } from '../db/schema';
import { getTableColumns } from "drizzle-orm";

type Props = {
    readonly type: string,
    readonly targetNodeLabel?: string,
    readonly targetNodeOptions?: Array<{ id: number, label: string }>,
    readonly addNode: (node: Node, targetNodeId?: number) => Promise<boolean>,
    readonly clearError: () => void
}

function buildEmptyNode(type: string): Node {
    return {
        name: "",
        summary: "",
        type: type,
    };
}

export function AddNodeRow(props: Props) {

    const [node, setNode] = React.useState<Node>(buildEmptyNode(props.type));
    const [targetNodeId, setTargetNodeId] = React.useState('');
    const editableColumns = React.useMemo(
        () => Object.keys(getTableColumns(nodesTable))
            .filter((column) => column !== "id" && column !== "type") as Array<keyof Omit<Node, "id" | "type">>,
        []
    );
    const canAddNode = React.useMemo(
        () => editableColumns.every((column) => node[column].trim().length > 0),
        [editableColumns, node]
    );

    async function addNode() {
        const selectedTargetNodeId = targetNodeId ? Number(targetNodeId) : undefined;
        const added = await props.addNode(node, selectedTargetNodeId);
        if (!added) {
            return;
        }
        setNode(buildEmptyNode(props.type));
        setTargetNodeId('');
    }

    function handleChange(column: keyof Omit<Node, "id" | "type">, value: string) {
        setNode({ ...node, [column]: value } as Node);
        props.clearError();
    }

    return (
        <tr>
            {editableColumns.map((column) => (
                    <td key={column}><Form.Control key={column} type="text" value={node[column]} onChange={e => handleChange(column, e.currentTarget.value)} /></td>
                ))}
                {props.targetNodeLabel && (
                    <td>
                        <Form.Select
                            value={targetNodeId}
                            onChange={(event) => {
                                setTargetNodeId(event.currentTarget.value);
                                props.clearError();
                            }}
                        >
                            <option value="">None</option>
                            {props.targetNodeOptions?.map((option) => (
                                <option key={option.id} value={option.id}>{option.label}</option>
                            ))}
                        </Form.Select>
                    </td>
                )}
                <td><Button variant="success" disabled={!canAddNode} onClick={() => addNode()}>Add</Button></td>
        </tr>
    );
}