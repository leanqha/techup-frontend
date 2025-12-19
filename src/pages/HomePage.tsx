import './HomePage.css';

export function HomePage() {
    const tiles = [
        { title: 'Profile', action: () => alert('Profile') },
        { title: 'Settings', action: () => alert('Settings') },
        { title: 'Users', action: () => alert('Users') },
        { title: 'Reports', action: () => alert('Reports') },
        { title: 'Analytics', action: () => alert('Analytics') },
        { title: 'Logout', action: () => alert('Logout') },
    ];

    return (
        <div style={{ padding: 24 }}>
            <h1>Dashboard</h1>

            <div className="grid">
                {tiles.map(tile => (
                    <button
                        key={tile.title}
                        className="tile"
                        onClick={tile.action}
                    >
                        {tile.title}
                    </button>
                ))}
            </div>
        </div>
    );
}