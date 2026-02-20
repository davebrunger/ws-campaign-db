import React from "react";
import { Button, Form } from "react-bootstrap";
import { nodesTable, type Node } from '../db/schema';
import { getTableColumns } from "drizzle-orm";

type Props = {
    readonly type: string,
    readonly addNode: (node: Node) => Promise<boolean>,
    readonly clearError: () => void
}

function buildEmptyNode(type: string): Node {
    return {
        name: "",
        type: type,
    };
}

export function AddNodeRow(props: Props) {

    const [node, setNode] = React.useState<Node>(buildEmptyNode(props.type));
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
        const added = await props.addNode(node);
        if (!added) {
            return;
        }
        setNode(buildEmptyNode(props.type));
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
                <td><Button variant="success" disabled={!canAddNode} onClick={() => addNode()}>Add</Button></td>
        </tr>
    );
}