import { NodeTable } from "../../components/nodeTable";

type Props = {
    readonly databaseName: string
}

export function Items(props: Props) {
    return (
        <>
            <h1>Items</h1>
            <NodeTable type="item" databaseName={props.databaseName}/>
        </>
    );
}