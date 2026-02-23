import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

import './HomePage.css';

import { useAuth } from '../context/useAuth';
import { fetchLessons } from '../api/schedule';
import { ScheduleDay } from '../components/schedule/ScheduleDay';
import type { Lesson } from '../api/types/schedule';
import { format } from 'date-fns';

export function HomePage() {
    const navigate = useNavigate();
    const { profile } = useAuth();

    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(false);

    const today = new Date();
    const todayISO = format(today, 'yyyy-MM-dd');

    useEffect(() => {
        if (!profile?.group_id) return;

        const loadToday = async () => {
            setLoading(true);
            try {
                const data = await fetchLessons(profile.group_id, todayISO, todayISO);
                setLessons(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error(e);
                setLessons([]);
            } finally {
                setLoading(false);
            }
        };

        loadToday();
    }, [profile?.group_id]);

    const tiles = [
        { title: 'Профиль', action: () => navigate('/profile') },
        { title: 'Расписание', action: () => navigate('/schedule') },
        {
            title: 'Обратная связь',
            action: () =>
                window.open(
                    'https://docs.google.com/forms/d/e/1FAIpQLSd76B06oxBRQtjt_L-8EJ-8VZJRUNbXFxXctRZRInKcaqe5zQ/viewform?usp=dialog',
                    '_blank'
                ),
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            <h1>Dashboard</h1>

            <h2 style={{ marginTop: 24 }}>Сегодня</h2>

            {loading ? (
                <p>Загрузка...</p>
            ) : (
                <ScheduleDay date={todayISO} lessons={lessons} />
            )}

            <div className="grid" style={{ marginTop: 32 }}>
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