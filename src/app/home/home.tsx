import { Link } from 'react-router';

export function Home() {
    return (
        <>
            <h1>Welcome to Campaign DB</h1>
            <ul>
                <li><Link to="/npcs">NPCs</Link></li>
                <li><Link to="/locations">Locations</Link></li>
                <li><Link to="/factions">Factions</Link></li>
                <li><Link to="/items">Items</Link></li>
                <li><Link to="/tags">Tags</Link></li>
            </ul>
        </>
    )
}