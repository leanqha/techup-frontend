// src/components/ScheduleFilters.tsx
import { useEffect, useState } from 'react';
import { fetchTeachers, fetchClassrooms } from '../api/schedule';

type Props = {
    date: string;
    teacherId: string;
    classroom: string;
    onChange: (v: { date: string; teacherId: string; classroom: string }) => void;
    onSearch: () => void;
};

export function ScheduleFilters({ date, teacherId, classroom, onChange, onSearch }: Props) {
    const [teachers, setTeachers] = useState<{ id: number; name: string }[]>([]);
    const [classrooms, setClassrooms] = useState<string[]>([]);

    const [teacherInput, setTeacherInput] = useState('');
    const [classroomInput, setClassroomInput] = useState('');

    useEffect(() => {
        fetchTeachers().then(setTeachers).catch(console.error);
        fetchClassrooms().then(setClassrooms).catch(console.error);
    }, []);

    // фильтруем варианты по вводимому тексту
    const filteredTeachers = teachers.filter(t =>
        t.name.toLowerCase().includes(teacherInput.toLowerCase())
    );
    const filteredClassrooms = classrooms.filter(c =>
        c.toLowerCase().includes(classroomInput.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <input
                type="date"
                value={date}
                onChange={e => onChange({ date: e.target.value, teacherId, classroom })}
            />

            <div style={{ position: 'relative' }}>
                <input
                    placeholder="Преподаватель"
                    value={teacherInput}
                    onChange={e => {
                        setTeacherInput(e.target.value);
                        const match = teachers.find(t =>
                            t.name.toLowerCase() === e.target.value.toLowerCase()
                        );
                        onChange({ date, teacherId: match ? String(match.id) : '', classroom });
                    }}
                    list="teachers-list"
                />
                <datalist id="teachers-list">
                    {filteredTeachers.map(t => (
                        <option key={t.id} value={t.name} />
                    ))}
                </datalist>
            </div>

            <div style={{ position: 'relative' }}>
                <input
                    placeholder="Аудитория"
                    value={classroomInput}
                    onChange={e => {
                        setClassroomInput(e.target.value);
                        onChange({ date, teacherId, classroom: e.target.value });
                    }}
                    list="classrooms-list"
                />
                <datalist id="classrooms-list">
                    {filteredClassrooms.map(c => (
                        <option key={c} value={c} />
                    ))}
                </datalist>
            </div>

            <button onClick={onSearch}>Найти</button>
        </div>
    );
}