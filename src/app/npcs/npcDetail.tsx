import * as React from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import { Link, useParams } from 'react-router';
import { useClient } from '@whitstable-software/sqlite-opfs';
import { loadMigrations } from '../../db/migrations';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { and, eq, or } from 'drizzle-orm';
import { edgesTable, nodesTable, type Edge } from '../../db/schema';

type Props = {
    readonly databaseName: string
}

const PRIMARY_LOCATION_EDGE_TYPE = 'primary_location';
const SECONDARY_LOCATION_EDGE_TYPE = 'secondary_location';

type LocationNode = {
    id: number,
    name: string
};

export function NpcDetail(props: Props) {
    const client = useClient({ databaseName: props.databaseName, migrations: loadMigrations });
    const db = React.useMemo(() => drizzle(client.exec), [props.databaseName]);
    const { npcId } = useParams();

    const parsedNpcId = React.useMemo(() => {
        if (!npcId) {
            return undefined;
        }
        const numericId = Number(npcId);
        if (!Number.isInteger(numericId) || numericId <= 0) {
            return undefined;
        }
        return numericId;
    }, [npcId]);

    const [loading, setLoading] = React.useState(true);
    const [name, setName] = React.useState('');
    const [summary, setSummary] = React.useState('');
    const [locations, setLocations] = React.useState<LocationNode[]>([]);
    const [primaryLocationId, setPrimaryLocationId] = React.useState<string>('');
    const [secondaryLocationIds, setSecondaryLocationIds] = React.useState<number[]>([]);
    const [errorMessage, setErrorMessage] = React.useState<string | undefined>(undefined);
    const [successMessage, setSuccessMessage] = React.useState<string | undefined>(undefined);
    const [notFound, setNotFound] = React.useState(false);

    const canSave = name.trim().length > 0 && summary.trim().length > 0 && !loading && !notFound;

    const loadNpc = React.useCallback(async (showLoading: boolean) => {
        if (!parsedNpcId) {
            setLoading(false);
            setNotFound(true);
            return;
        }

        if (showLoading) {
            setLoading(true);
        }

        const npcRows = await db
            .select()
            .from(nodesTable)
            .where(and(eq(nodesTable.id, parsedNpcId), eq(nodesTable.type, 'npc')));

        if (npcRows.length === 0) {
            setNotFound(true);
            setLoading(false);
            return;
        }

        const npc = npcRows[0];
        setName(npc.name);
        setSummary(npc.summary);
        setNotFound(false);

        const locationRows = await db
            .select({ id: nodesTable.id, name: nodesTable.name })
            .from(nodesTable)
            .where(eq(nodesTable.type, 'location'));

        setLocations(locationRows);

        const edgeRows = await db
            .select()
            .from(edgesTable)
            .where(
                and(
                    eq(edgesTable.fromId, parsedNpcId),
                    or(
                        eq(edgesTable.type, PRIMARY_LOCATION_EDGE_TYPE),
                        eq(edgesTable.type, SECONDARY_LOCATION_EDGE_TYPE)
                    )
                )
            );

        const primaryEdge = edgeRows.find((edge) => edge.type === PRIMARY_LOCATION_EDGE_TYPE);
        setPrimaryLocationId(primaryEdge ? String(primaryEdge.toId) : '');
        setSecondaryLocationIds(
            edgeRows
                .filter((edge) => edge.type === SECONDARY_LOCATION_EDGE_TYPE)
                .map((edge) => edge.toId)
        );

        setLoading(false);
    }, [db, parsedNpcId]);

    React.useEffect(() => {
        void loadNpc(true);
    }, [loadNpc]);

    function toggleSecondaryLocation(locationId: number, selected: boolean) {
        if (selected) {
            if (secondaryLocationIds.includes(locationId)) {
                return;
            }
            setSecondaryLocationIds([...secondaryLocationIds, locationId]);
            return;
        }
        setSecondaryLocationIds(secondaryLocationIds.filter((id) => id !== locationId));
    }

    async function saveNpc() {
        if (!parsedNpcId) {
            return;
        }

        if (!name.trim() || !summary.trim()) {
            setErrorMessage('Name and summary are required.');
            setSuccessMessage(undefined);
            return;
        }

        try {
            await db
                .update(nodesTable)
                .set({
                    name: name.trim(),
                    summary: summary.trim(),
                })
                .where(and(eq(nodesTable.id, parsedNpcId), eq(nodesTable.type, 'npc')));

            await db
                .delete(edgesTable)
                .where(
                    and(
                        eq(edgesTable.fromId, parsedNpcId),
                        or(
                            eq(edgesTable.type, PRIMARY_LOCATION_EDGE_TYPE),
                            eq(edgesTable.type, SECONDARY_LOCATION_EDGE_TYPE)
                        )
                    )
                );

            const newEdges: Edge[] = [];

            if (primaryLocationId) {
                newEdges.push({
                    fromId: parsedNpcId,
                    toId: Number(primaryLocationId),
                    type: PRIMARY_LOCATION_EDGE_TYPE,
                });
            }

            for (const secondaryLocationId of secondaryLocationIds) {
                if (primaryLocationId && secondaryLocationId === Number(primaryLocationId)) {
                    continue;
                }
                newEdges.push({
                    fromId: parsedNpcId,
                    toId: secondaryLocationId,
                    type: SECONDARY_LOCATION_EDGE_TYPE,
                });
            }

            if (newEdges.length > 0) {
                await db.insert(edgesTable).values(newEdges);
            }

            setErrorMessage(undefined);
            setSuccessMessage('NPC saved.');
            await loadNpc(false);
        } catch (error) {
            const message = error instanceof Error ? error.message.toLowerCase() : '';
            if (message.includes('node_ux') || message.includes('unique') || message.includes('constraint')) {
                setErrorMessage('Could not save NPC. This name is already used by another NPC.');
            } else {
                setErrorMessage('Could not save NPC. Please try again.');
            }
            setSuccessMessage(undefined);
        }
    }

    if (!parsedNpcId) {
        return (
            <>
                <h1>NPC Detail</h1>
                <Alert variant="danger">Invalid NPC id.</Alert>
                <Link to="/npcs">Back to NPCs</Link>
            </>
        );
    }

    if (loading) {
        return (
            <>
                <h1>NPC Detail</h1>
                <div>Loading...</div>
            </>
        );
    }

    if (notFound) {
        return (
            <>
                <h1>NPC Detail</h1>
                <Alert variant="danger">NPC not found.</Alert>
                <Link to="/npcs">Back to NPCs</Link>
            </>
        );
    }

    return (
        <>
            <h1>NPC Detail</h1>
            <p><Link to="/npcs">Back to NPCs</Link></p>
            {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
            {successMessage && <Alert variant="success">{successMessage}</Alert>}

            <Form>
                <Form.Group className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                        type="text"
                        value={name}
                        onChange={(event) => {
                            setName(event.currentTarget.value);
                            setErrorMessage(undefined);
                            setSuccessMessage(undefined);
                        }}
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Summary</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={4}
                        value={summary}
                        onChange={(event) => {
                            setSummary(event.currentTarget.value);
                            setErrorMessage(undefined);
                            setSuccessMessage(undefined);
                        }}
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Primary Location (0 or 1)</Form.Label>
                    <Form.Select
                        value={primaryLocationId}
                        onChange={(event) => {
                            const selectedPrimaryLocationId = event.currentTarget.value;
                            setPrimaryLocationId(selectedPrimaryLocationId);
                            if (selectedPrimaryLocationId) {
                                const numericLocationId = Number(selectedPrimaryLocationId);
                                setSecondaryLocationIds((ids) => ids.filter((id) => id !== numericLocationId));
                            }
                            setErrorMessage(undefined);
                            setSuccessMessage(undefined);
                        }}
                    >
                        <option value="">None</option>
                        {locations.map((location) => (
                            <option key={location.id} value={location.id}>{location.name}</option>
                        ))}
                    </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Secondary Locations (0 or more)</Form.Label>
                    {locations.length === 0 && <div>No locations available.</div>}
                    {locations.map((location) => {
                        if (String(location.id) === primaryLocationId) {
                            return null;
                        }
                        const checked = secondaryLocationIds.includes(location.id);
                        return (
                            <Form.Check
                                key={location.id}
                                type="checkbox"
                                label={location.name}
                                checked={checked}
                                onChange={(event) => {
                                    toggleSecondaryLocation(location.id, event.currentTarget.checked);
                                    setErrorMessage(undefined);
                                    setSuccessMessage(undefined);
                                }}
                            />
                        );
                    })}
                </Form.Group>

                <Button variant="success" disabled={!canSave} onClick={() => void saveNpc()}>
                    Save
                </Button>
            </Form>
        </>
    );
}
