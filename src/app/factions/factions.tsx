import { NodeTable } from "../../components/nodeTable";

type Props = {
    readonly databaseName: string
}

export function Factions(props: Props) {
    return (
        <>
            <h1>Factions</h1>
            <NodeTable type="faction" databaseName={props.databaseName}/>
        </>
    );
}