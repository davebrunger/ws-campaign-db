import React from "react";
import { Button, Form } from "react-bootstrap";
import type { User } from "./db/schema";

type Props = {
    readonly addUser: (user: User) => Promise<boolean>
}

export function AddUserRow(props: Props) {

    const [name, setName] = React.useState("");
    const [age, setAge] = React.useState<number | undefined>(undefined);
    const [email, setEmail] = React.useState("");

    async function addUser() {
        const added = await props.addUser({ name, age: age!, email });
        if (!added) {
            return;
        }
        setName("");
        setAge(undefined);
        setEmail("");
    }

    return (
        <tr>
            <td>&nbsp;</td>
            <td><Form.Control key={"name"} type="text" value={name} onChange={e => setName(e.currentTarget.value)} /></td>
            <td><Form.Control key={"age"} type="number" value={age} onChange={e => setAge(parseInt(e.currentTarget.value, 10))} /></td>
            <td><Form.Control key={"email"} type="email" value={email} onChange={e => setEmail(e.currentTarget.value)} placeholder="name@example.com" /></td>
            <td><Button variant="success" onClick={() => addUser()}>Add</Button></td>
        </tr>
    );
}