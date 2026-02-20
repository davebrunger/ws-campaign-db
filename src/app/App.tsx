import './App.css'
import { Container, Nav, Navbar } from 'react-bootstrap';
import { Link, Route, Routes } from 'react-router';
import { Npcs } from './npcs/npc';
import { Home } from './home/home';
import { Locations } from './locations/locations';
import { Factions } from './factions/factions';
import { Items } from './items/items';

const databaseName = "campaign";

export function App() {
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
                    </Nav>
                </Container>
            </Navbar>
            <Container>
                <Routes>
                    <Route path="/" >
                        <Route index element={<Home />} />
                        <Route path="npcs" element={<Npcs databaseName={databaseName} />} />
                        <Route path="locations" element={<Locations databaseName={databaseName} />} />
                        <Route path="factions" element={<Factions databaseName={databaseName} />} />
                        <Route path="items" element={<Items databaseName={databaseName} />} />
                    </Route>
                </Routes>
            </Container>
        </>
    )
}