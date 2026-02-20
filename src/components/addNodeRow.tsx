import React from "react";
import { Button, Form } from "react-bootstrap";
import { nodesTable, type Node } from '../db/schema';
import { getTableColumns } from "drizzle-orm";

type Props = {
    readonly type: string,
    readonly addNode: (node: Node) => Promise<boolean>
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

    async function addNode() {
        const added = await props.addNode(node);
        if (!added) {
            return;
        }
        setNode(buildEmptyNode(props.type));
    }

    return (
        <tr>
            {editableColumns.map((column) => (
                    <td key={column}><Form.Control key={column} type="text" value={node[column]} onChange={e => setNode({ ...node, [column]: e.currentTarget.value } as Node)} /></td>
                ))}
                <td><Button variant="success" onClick={() => addNode()}>Add</Button></td>
        </tr>
    );
}