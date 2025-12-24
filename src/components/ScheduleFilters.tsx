import { useEffect, useState } from 'react';
import Select, {type SingleValue } from 'react-select';
import { fetchTeachers, fetchClassrooms } from '../api/schedule';
import type {Profile} from '../api/types/types.ts';

type Props = {
    date: string;
    teacherId: number | null; // для API
    classroom: string;
    onChange: (v: { date: string; teacherId: number | null; classroom: string }) => void;
    onSearch: () => void;
};

type TeacherOption = { value: number; label: string };
type ClassroomOption = { value: string; label: string };

export function ScheduleFilters({ date, teacherId, classroom, onChange, onSearch }: Props) {
    const [teachers, setTeachers] = useState<Profile[]>([]);
    const [classrooms, setClassrooms] = useState<string[]>([]);

    const [selectedTeacher, setSelectedTeacher] = useState<TeacherOption | null>(null);
    const [selectedClassroom, setSelectedClassroom] = useState<ClassroomOption | null>(null);

    useEffect(() => {
        fetchTeachers().then(setTeachers).catch(console.error);
        fetchClassrooms().then(setClassrooms).catch(console.error);
    }, []);

    const teacherOptions: TeacherOption[] = teachers.map(t => ({
        value: t.id, // для API
        label: `${t.last_name} ${t.first_name}${t.middle_name ? ' ' + t.middle_name : ''}`, // для отображения
    }));

    const classroomOptions: ClassroomOption[] = classrooms.map(c => ({ value: c, label: c }));

    return (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <input
                type="date"
                value={date}
                onChange={e => onChange({ date: e.target.value, teacherId, classroom })}
            />

            <div style={{ minWidth: 200 }}>
                <Select<TeacherOption, false>
                    placeholder="Преподаватель"
                    options={teacherOptions}
                    value={selectedTeacher}
                    onChange={(option: SingleValue<TeacherOption>) => {
                        setSelectedTeacher(option);
                        onChange({
                            date,
                            teacherId: option ? option.value : null,
                            classroom,
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
                        setSelectedClassroom(option);
                        onChange({
                            date,
                            teacherId,
                            classroom: option ? option.value : '',
                        });
                    }}
                    isClearable
                />
            </div>

            <button onClick={onSearch}>Найти</button>
        </div>
    );
}