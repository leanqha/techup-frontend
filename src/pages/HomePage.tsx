import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import {TodaySchedule} from "../components/TodaySchedule.tsx";

export function HomePage() {
    const navigate = useNavigate();

    const tiles = [
        { title: 'Профиль', action: () => navigate('/profile') },
        { title: 'Settings', action: () => alert('Settings') },
        { title: 'Users', action: () => alert('Users') },
        { title: 'Обратная связь', action: () => window.open(
            'https://docs.google.com/forms/d/e/1FAIpQLSd76B06oxBRQtjt_L-8EJ-8VZJRUNbXFxXctRZRInKcaqe5zQ/viewform?usp=dialog',
            '_blank')
        },
        { title: 'Analytics', action: () => alert('Analytics') },
    ];

    return (
        <div style={{ padding: 24 }}>
            <h1>Dashboard</h1>
            <TodaySchedule/>

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