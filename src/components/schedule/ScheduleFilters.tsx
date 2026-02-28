import { useEffect, useState } from 'react';
import Select, {type SingleValue } from 'react-select';
import { fetchTeachers, fetchClassrooms } from '../../api/schedule.ts';
import type {Teacher} from '../../api/types/schedule.ts';

type Props = {
    date: string;
    teacherId: number | null; // для API
    classroom: string;
    subject: string;
    onChange: (v: { date: string; teacherId: number | null; classroom: string; subject: string }) => void;
    onSearch: () => void;
};

type TeacherOption = { value: number; label: string };
type ClassroomOption = { value: string; label: string };

export function ScheduleFilters({ date, teacherId, classroom, subject, onChange, onSearch }: Props) {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [classrooms, setClassrooms] = useState<string[]>([]);

    const teacherOptions: TeacherOption[] = teachers.map(t => ({
        value: t.id, // для API
        label: t.full_name?.trim() || `${t.last_name} ${t.first_name}${t.middle_name ? ' ' + t.middle_name : ''}`,
    }));

    const classroomOptions: ClassroomOption[] = classrooms.map(c => ({ value: c, label: c }));

    const selectedTeacher = teacherOptions.find(option => option.value === teacherId) ?? null;
    const selectedClassroom = classroomOptions.find(option => option.value === classroom) ?? null;

    useEffect(() => {
        fetchTeachers().then(setTeachers).catch(console.error);
        fetchClassrooms().then(setClassrooms).catch(console.error);
    }, []);

    return (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <input
                type="date"
                value={date}
                onChange={e => onChange({ date: e.target.value, teacherId, classroom, subject })}
            />

            <div style={{ minWidth: 200 }}>
                <Select<TeacherOption, false>
                    placeholder="Преподаватель"
                    options={teacherOptions}
                    value={selectedTeacher}
                    onChange={(option: SingleValue<TeacherOption>) => {
                        onChange({
                            date,
                            teacherId: option ? option.value : null,
                            classroom,
                            subject,
                        });
                    }}
                    isClearable
                />
            </div>

            <div style={{ minWidth: 150 }}>
                <Select<ClassroomOption, false>
                    placeholder="Аудитория"
                    options={classroomOptions}
                    value={selectedClassroom}
                    onChange={(option: SingleValue<ClassroomOption>) => {
                        onChange({
                            date,
                            teacherId,
                            classroom: option ? option.value : '',
                            subject,
                        });
                    }}
                    isClearable
                />
            </div>

            <input
                type="text"
                placeholder="Предмет"
                value={subject}
                onChange={e => onChange({ date, teacherId, classroom, subject: e.target.value })}
            />

            <button onClick={onSearch}>Найти</button>
        </div>
    );
}