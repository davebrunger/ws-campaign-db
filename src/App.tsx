import * as React from 'react';
import './App.css'
import { useClient } from '@whitstable-software/sqlite-opfs'
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { usersTable, type User } from './db/schema';
import { Button, Container, Navbar, Table } from 'react-bootstrap';
import { eq } from 'drizzle-orm';
import { AddUserRow } from './AddUserRow';
import { loadMigrations } from './db/migrations';

const databaseName = "campaign";

// const initSql = `
//     CREATE TABLE IF NOT EXISTS \`users_table\` (
//         \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
//         \`name\` text NOT NULL,
//         \`age\` integer NOT NULL,
//         \`email\` text NOT NULL
//     );
//     --> statement-breakpoint
//     CREATE UNIQUE INDEX IF NOT EXISTS \`users_table_email_unique\` ON \`users_table\` (\`email\`);
// `;

function App() {

    const client = React.useRef(useClient({databaseName, migrations : loadMigrations }));
    const db = React.useRef(drizzle(client.current.exec));

    const [users, setUsers] = React.useState<User[] | undefined>(undefined);


    async function updateUsers() {
        var newUsers = await db.current.select().from(usersTable);
        setUsers(newUsers);
    }

    async function deleteUser(userId: number) {
        await db.current.delete(usersTable).where(eq(usersTable.id, userId));
        await updateUsers();
    }

    async function addUser(user : User) {
        if (!user.name || !user.age || !user.email) {
            return false;
        }
        await db.current.insert(usersTable).values(user);
        await updateUsers();
        return true;
    }

    React.useEffect(() => {
        updateUsers();
    }, []);

    function UsersTableContents() {
        if (users === undefined) {
            return <tr><td colSpan={5}>Please wait...</td></tr>;
        } else if (users!.length === 0) {
            return (
                <>
                    <AddUserRow addUser={addUser} />
                    <tr><td colSpan={5}>No users to display</td></tr>
                </>
            );
        } else {
            return (
                <>
                    <AddUserRow addUser={addUser} />
                    {users!.map(u => (
                        <tr key={u.id}>
                            <td>{u.id}</td>
                            <td>{u.name}</td>
                            <td>{u.age}</td>
                            <td>{u.email}</td>
                            <td><Button variant='danger' onClick={() => { deleteUser(u.id!) }}>Delete</Button></td>
                        </tr>
                    ))}
                </>
            );
        }
    }

    return (
        <>
            <Navbar>
                <Container>
                    <Navbar.Brand>Campaign DB</Navbar.Brand>
                </Container>
            </Navbar>
            <Container>
                <h1>Users</h1>
                <Table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Age</th>
                            <th>Email</th>
                        </tr>
                    </thead>
                    <tbody>
                        <UsersTableContents />
                    </tbody>
                </Table>
            </Container>
        </>
    )
}

export default App
