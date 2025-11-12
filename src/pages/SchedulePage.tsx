// SchedulePage.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";

interface Lesson {
    id: number;
    group: string;
    teacher: string;
    classroom: string;
    subject: string;
    day: string;
    time: string;
    is_even_week: boolean;
}

const daysOfWeek = ["Понедельник","Вторник","Среда","Четверг","Пятница","Суббота","Воскресенье"];

const SchedulePage: React.FC = () => {
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [groups, setGroups] = useState<string[]>([]);
    const [faculties, setFaculties] = useState<string[]>([]);

    const [filters, setFilters] = useState({
        group: "",
        teacher: "",
        classroom: "",
        day: "",
        from: "",
        to: "",
        is_even_week: "",
    });

    useEffect(() => {
        axios.get("/schedule/groups").then(res => setGroups(res.data));
        axios.get("/schedule/faculties").then(res => setFaculties(res.data));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleSearch = async () => {
        const params: any = { ...filters };
        Object.keys(params).forEach(key => params[key] === "" && delete params[key]);

        try {
            const res = await axios.get("/schedule/search", { params });
            setLessons(res.data);
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.error || "Ошибка при поиске");
        }
    };

    // группируем уроки по дню
    const lessonsByDay: Record<string, Lesson[]> = {};
    daysOfWeek.forEach(day => { lessonsByDay[day] = []; });
    lessons.forEach(lesson => { lessonsByDay[lesson.day].push(lesson); });

    return (
        <div style={{ padding: 20 }}>
            <h1>Расписание</h1>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
                <select name="group" value={filters.group} onChange={handleChange}>
                    <option value="">Выберите группу</option>
                    {groups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>

                <input type="text" name="teacher" placeholder="Преподаватель" value={filters.teacher} onChange={handleChange} />
                <input type="text" name="classroom" placeholder="Аудитория" value={filters.classroom} onChange={handleChange} />

                <select name="day" value={filters.day} onChange={handleChange}>
                    <option value="">День недели</option>
                    {daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                <input type="time" name="from" value={filters.from} onChange={handleChange} />
                <input type="time" name="to" value={filters.to} onChange={handleChange} />

                <select name="is_even_week" value={filters.is_even_week} onChange={handleChange}>
                    <option value="">Любая неделя</option>
                    <option value="true">Четная неделя</option>
                    <option value="false">Нечетная неделя</option>
                </select>

                <button onClick={handleSearch}>Поиск</button>
            </div>

            {daysOfWeek.map(day => (
                <div key={day} style={{ marginBottom: 20 }}>
                    <h2>{day}</h2>
                    {lessonsByDay[day].length === 0 ? (
                        <p style={{ color: "#777" }}>Нет уроков</p>
                    ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                            {lessonsByDay[day].map(lesson => (
                                <div key={lesson.id} style={{
                                    border: "1px solid #ccc",
                                    borderRadius: 6,
                                    padding: 10,
                                    minWidth: 200,
                                    backgroundColor: lesson.is_even_week ? "#e0f7fa" : "#fff3e0"
                                }}>
                                    <strong>{lesson.subject}</strong>
                                    <p>Группа: {lesson.group}</p>
                                    <p>Преподаватель: {lesson.teacher}</p>
                                    <p>Аудитория: {lesson.classroom}</p>
                                    <p>Время: {lesson.time}</p>
                                    <p>Неделя: {lesson.is_even_week ? "Четная" : "Нечетная"}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default SchedulePage;