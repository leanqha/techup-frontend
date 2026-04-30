import { useEffect, useState, useMemo } from 'react';

import './HomePage.css';

import { useAuth } from '../context/useAuth';
import { fetchLessons } from '../api/schedule';
import { ScheduleDay } from '../components/schedule/ScheduleDay';
import type { Lesson } from '../api/types/schedule';
import { format } from 'date-fns';
import {Loader} from "../components/Loader.tsx";

export function HomePage() {
    const { profile } = useAuth();

    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(false);

    const todayISO = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

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
    }, [profile?.group_id, todayISO]);

    return (
        <div
            style={{
                padding: 16,
                maxWidth: 1200,
                margin: '0 auto',
                overflowX: 'hidden',
            }}
        >
            <h2 style={{ marginTop: 16, fontSize: 20, fontWeight: 600 }}>Сегодня</h2>

            {loading ? (
                <Loader />
            ) : lessons.length > 0 ? (
                <ScheduleDay date={todayISO} lessons={lessons} />
            ) : (
                <div
                    style={{
                        padding: 16,
                        borderRadius: 12,
                        background: '#F3F4F6',
                        textAlign: 'center',
                        fontSize: 14,
                        color: '#6B7280',
                    }}
                >
                    Пар сегодня нет 🎉
                </div>
            )}

            <div
                style={{
                    marginTop: 32,
                    display: 'grid',
                    gap: 12,
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                }}
            >
            </div>
        </div>
    );
}