import * as React from 'react';
import { Alert, Button, Form, Table } from 'react-bootstrap';
import { useClient } from '@whitstable-software/sqlite-opfs';
import { loadMigrations } from '../../db/migrations';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { eq } from 'drizzle-orm';
import { tagsTable, type Tag } from '../../db/schema';

type Props = {
    readonly databaseName: string
}

export function Tags(props: Props) {
    const client = useClient({ databaseName: props.databaseName, migrations: loadMigrations });
    const db = React.useMemo(() => drizzle(client.exec), [client]);

    const [tags, setTags] = React.useState<Tag[] | undefined>(undefined);
    const [name, setName] = React.useState("");
    const [errorMessage, setErrorMessage] = React.useState<string | undefined>(undefined);
    const canAddTag = name.trim().length > 0;

    function getTagErrorMessage(error: unknown): string {
        const message = error instanceof Error ? error.message.toLowerCase() : "";
        if (message.includes("unique") || message.includes("constraint") || message.includes("tag.name") || message.includes("tag_name_unique")) {
            return "A tag with that name already exists.";
        }
        return "Could not save tag. Please try again.";
    }

    const updateTags = React.useCallback(async () => {
        const newTags = await db.select().from(tagsTable);
        setTags(newTags);
    }, [db]);

    const addTag = React.useCallback(async () => {
        if (!name.trim()) {
            return;
        }
        try {
            await db.insert(tagsTable).values({ name: name.trim() });
            setName("");
            setErrorMessage(undefined);
            await updateTags();
        } catch (error) {
            setErrorMessage(getTagErrorMessage(error));
        }
    }, [db, name, updateTags]);

    const deleteTag = React.useCallback(async (tagId: number) => {
        try {
            await db.delete(tagsTable).where(eq(tagsTable.id, tagId));
            setErrorMessage(undefined);
            await updateTags();
        } catch {
            setErrorMessage("Could not delete tag. Please try again.");
        }
    }, [db, updateTags]);

    React.useEffect(() => {
        void updateTags();
    }, [updateTags]);

    return (
        <>
            <h1>Tags</h1>
            {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
            <Table size='sm'>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><Form.Control type="text" value={name} onChange={e => { setName(e.currentTarget.value); setErrorMessage(undefined); }} /></td>
                        <td><Button variant="success" disabled={!canAddTag} onClick={() => void addTag()}>Add</Button></td>
                    </tr>
                    {tags?.map((tag) => (
                        <tr key={tag.id}>
                            <td>{tag.name}</td>
                            <td><Button variant='danger' onClick={() => void deleteTag(tag.id!)}>Delete</Button></td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </>
    );
}