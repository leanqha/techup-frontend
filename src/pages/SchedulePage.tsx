import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const API_BASE = "http://46.37.123.72/api/v1";

// ---- типы ----
type Lesson = {
    id: number;
    subject: string;
    teacher: string;
    room: string;
    start_time: string;
    end_time: string;
    weekday: number; // 1–7 (пока бэк может отдавать всё подряд)
};

const WEEKDAYS = [
    "Понедельник",
    "Вторник",
    "Среда",
    "Четверг",
    "Пятница",
    "Суббота",
    "Воскресенье",
];

export default function SchedulePage() {
    const [group, setGroup] = useState("A-101");
    const [week, setWeek] = useState("current");
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadSchedule();
    }, [group, week]);

    const loadSchedule = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(
                `${API_BASE}/schedule/lessons?group=${group}&week=${week}`,
                {
                    credentials: "include",
                }
            );

            if (!res.ok) throw new Error("Не удалось загрузить расписание");

            const data = await res.json();
            setLessons(data ?? []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    // группируем по дням (даже если бэк пока не умеет фильтровать)
    const grouped = lessons.reduce<Record<number, Lesson[]>>((acc, l) => {
        acc[l.weekday] = acc[l.weekday] || [];
        acc[l.weekday].push(l);
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="mx-auto max-w-6xl space-y-6">
                {/* заголовок */}
                <motion.h1
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-semibold"
                >
                    Расписание занятий
                </motion.h1>

                {/* фильтры */}
                <div className="flex flex-wrap gap-4 rounded-2xl bg-white p-4 shadow">
                    <div className="flex flex-col">
                        <label className="text-sm text-gray-500">Группа</label>
                        <input
                            value={group}
                            onChange={(e) => setGroup(e.target.value)}
                            className="rounded-lg border px-3 py-2"
                            placeholder="Например A-101"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm text-gray-500">Неделя</label>
                        <select
                            value={week}
                            onChange={(e) => setWeek(e.target.value)}
                            className="rounded-lg border px-3 py-2"
                        >
                            <option value="current">Текущая</option>
                            <option value="next">Следующая</option>
                        </select>
                    </div>
                </div>

                {/* контент */}
                {loading && (
                    <div className="text-center text-gray-500">Загрузка...</div>
                )}

                {error && (
                    <div className="rounded-xl bg-red-50 p-4 text-red-600">
                        {error}
                    </div>
                )}

                {!loading && !error && (
                    <div className="space-y-6">
                        {Object.keys(grouped).length === 0 && (
                            <div className="rounded-xl bg-white p-6 text-center text-gray-500 shadow">
                                Нет занятий
                            </div>
                        )}

                        {Object.entries(grouped).map(([day, items]) => (
                            <motion.div
                                key={day}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-3"
                            >
                                <h2 className="text-xl font-medium">
                                    {WEEKDAYS[Number(day) - 1] ?? `День ${day}`}
                                </h2>

                                <div className="grid gap-3">
                                    {items.map((l) => (
                                        <div
                                            key={l.id}
                                            className="rounded-2xl bg-white p-4 shadow transition hover:shadow-md"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="text-lg font-semibold">
                                                    {l.subject}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {l.start_time} – {l.end_time}
                                                </div>
                                            </div>

                                            <div className="mt-2 text-sm text-gray-600">
                                                {l.teacher} · аудитория {l.room}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
