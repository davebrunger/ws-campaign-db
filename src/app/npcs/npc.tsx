import { NodeTable } from "../../components/nodeTable";

type Props = {
    readonly databaseName: string
}

export function Npcs(props: Props) {
    return (
        <>
            <h1>NPCs</h1>
            <NodeTable type="npc" databaseName={props.databaseName}/>
        </>
    );
}