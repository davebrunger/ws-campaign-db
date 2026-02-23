import './App.css'
import { Suspense, lazy } from 'react';
import { Button, Container, Nav, Navbar } from 'react-bootstrap';
import { Link, Route, Routes } from 'react-router';
import { backupDatabase, useClient } from '@whitstable-software/sqlite-opfs';
import { loadMigrations } from '../db/migrations';

const Home = lazy(() => import('./home/home').then((module) => ({ default: module.Home })));
const Npcs = lazy(() => import('./npcs/npc').then((module) => ({ default: module.Npcs })));
const NpcDetail = lazy(() => import('./npcs/npcDetail').then((module) => ({ default: module.NpcDetail })));
const Locations = lazy(() => import('./locations/locations').then((module) => ({ default: module.Locations })));
const Factions = lazy(() => import('./factions/factions').then((module) => ({ default: module.Factions })));
const Items = lazy(() => import('./items/items').then((module) => ({ default: module.Items })));
const Tags = lazy(() => import('./tags/tags').then((module) => ({ default: module.Tags })));

const databaseName = "campaign";

export function App() {
    const client = useClient({ databaseName, migrations: loadMigrations });

    async function exportDatabase() {
        await backupDatabase(client);
    }

    return (
        <>
            <Navbar>
                <Container>
                    <Navbar.Brand as={Link} to="/">Campaign DB</Navbar.Brand>
                    <Nav>
                        <Nav.Link as={Link} to="/npcs">NPCs</Nav.Link>
                        <Nav.Link as={Link} to="/locations">Locations</Nav.Link>
                        <Nav.Link as={Link} to="/factions">Factions</Nav.Link>
                        <Nav.Link as={Link} to="/items">Items</Nav.Link>
                        <Nav.Link as={Link} to="/tags">Tags</Nav.Link>
                    </Nav>
                    <Button variant="outline-secondary" size="sm" onClick={() => void exportDatabase()}>
                        Export
                    </Button>
                </Container>
            </Navbar>
            <Container>
                <Suspense fallback={<div>Loading...</div>}>
                    <Routes>
                        <Route path="/" >
                            <Route index element={<Home />} />
                            <Route path="npcs" element={<Npcs databaseName={databaseName} />} />
                            <Route path="npcs/:npcId" element={<NpcDetail databaseName={databaseName} />} />
                            <Route path="locations" element={<Locations databaseName={databaseName} />} />
                            <Route path="factions" element={<Factions databaseName={databaseName} />} />
                            <Route path="items" element={<Items databaseName={databaseName} />} />
                            <Route path="tags" element={<Tags databaseName={databaseName} />} />
                        </Route>
                    </Routes>
                </Suspense>
            </Container>
        </>
    )
}