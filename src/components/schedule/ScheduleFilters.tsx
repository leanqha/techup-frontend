import { useEffect, useState } from 'react';
import Select, {type SingleValue } from 'react-select';
import { fetchTeachers, fetchClassrooms } from '../../api/schedule.ts';
import type {Profile} from '../../api/types/types.ts';
import './ScheduleFilters.css';

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
    const [teachers, setTeachers] = useState<Profile[]>([]);
    const [classrooms, setClassrooms] = useState<string[]>([]);

    const teacherOptions: TeacherOption[] = teachers.map(t => {
        const nameParts = [t.last_name, t.first_name, t.middle_name].filter(Boolean);
        return {
            value: t.id, // для API
            label: nameParts.length ? nameParts.join(' ') : t.email || t.uid,
        };
    });

    const classroomOptions: ClassroomOption[] = classrooms.map(c => ({ value: c, label: c }));

    const selectedTeacher = teacherOptions.find(option => option.value === teacherId) ?? null;
    const selectedClassroom = classroomOptions.find(option => option.value === classroom) ?? null;

    useEffect(() => {
        fetchTeachers().then(setTeachers).catch(console.error);
        fetchClassrooms().then(setClassrooms).catch(console.error);
    }, []);

    return (
        <div className="schedule-filters">
            <div className="schedule-filters__field">
                <input
                    className="schedule-filters__input"
                    type="date"
                    value={date}
                    onChange={e => onChange({ date: e.target.value, teacherId, classroom, subject })}
                />
            </div>

            <div className="schedule-filters__field schedule-filters__field--wide">
                <Select<TeacherOption, false>
                    className="schedule-filter-select"
                    classNamePrefix="schedule-filter-select"
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

            <div className="schedule-filters__field">
                <Select<ClassroomOption, false>
                    className="schedule-filter-select"
                    classNamePrefix="schedule-filter-select"
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

            <div className="schedule-filters__field">
                <input
                    className="schedule-filters__input"
                    type="text"
                    placeholder="Предмет"
                    value={subject}
                    onChange={e => onChange({ date, teacherId, classroom, subject: e.target.value })}
                />
            </div>

            <div className="schedule-filters__action">
                <button className="schedule-filters__submit" onClick={onSearch}>Найти</button>
            </div>
        </div>
    );
}