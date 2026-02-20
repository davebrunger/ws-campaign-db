import { NodeTable } from "../../components/nodeTable";

type Props = {
    readonly databaseName: string
}

export function Locations(props: Props) {
    return (
        <>
            <h1>Locations</h1>
            <NodeTable type="location" databaseName={props.databaseName}/>
        </>
    );
}