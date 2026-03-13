import { useEffect, useState } from 'react';
import Select, {type SingleValue } from 'react-select';
import { fetchTeachers, fetchClassrooms, fetchGroups } from '../../api/schedule.ts';
import type { Group } from '../../api/types/schedule.ts';
import type { Profile as AccountProfile } from '../../api/types/types.ts';
import './ScheduleFilters.css';

type FilterValues = {
    date: string;
    teacherId: number | null;
    groupId: number | null;
    classroom: string;
    subject: string;
};

type Props = {
    date: string;
    teacherId: number | null; // для API
    groupId: number | null;
    classroom: string;
    subject: string;
    onChange: (v: FilterValues) => void;
    onSearch: () => void;
};

type TeacherOption = { value: number; label: string };
type GroupOption = { value: number; label: string };
type ClassroomOption = { value: string; label: string };

export function ScheduleFilters({ date, teacherId, groupId, classroom, subject, onChange, onSearch }: Props) {
    const [teachers, setTeachers] = useState<AccountProfile[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [classrooms, setClassrooms] = useState<string[]>([]);

    const teacherOptions: TeacherOption[] = teachers.map(t => {
        const nameParts = [t.last_name, t.first_name, t.middle_name].filter(Boolean);
        return {
            value: t.id, // для API
            label: nameParts.length ? nameParts.join(' ') : t.email || t.uid,
        };
    });

    const groupOptions: GroupOption[] = groups.map(group => ({ value: group.id, label: group.name }));
    const classroomOptions: ClassroomOption[] = classrooms.map(c => ({ value: c, label: c }));

    const selectedTeacher = teacherOptions.find(option => option.value === teacherId) ?? null;
    const selectedGroup = groupOptions.find(option => option.value === groupId) ?? null;
    const selectedClassroom = classroomOptions.find(option => option.value === classroom) ?? null;

    useEffect(() => {
        fetchTeachers().then(setTeachers).catch(console.error);
        fetchGroups().then(setGroups).catch(console.error);
        fetchClassrooms().then(setClassrooms).catch(console.error);
    }, []);

    return (
        <div className="schedule-filters">
            <div className="schedule-filters__field">
                <input
                    className="schedule-filters__input"
                    type="date"
                    value={date}
                    onChange={e => onChange({ date: e.target.value, teacherId, groupId, classroom, subject })}
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
                            groupId,
                            classroom,
                            subject,
                        });
                    }}
                    isClearable
                />
            </div>

            <div className="schedule-filters__field schedule-filters__field--wide">
                <Select<GroupOption, false>
                    className="schedule-filter-select"
                    classNamePrefix="schedule-filter-select"
                    placeholder="Группа"
                    options={groupOptions}
                    value={selectedGroup}
                    onChange={(option: SingleValue<GroupOption>) => {
                        onChange({
                            date,
                            teacherId,
                            groupId: option ? option.value : null,
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
                            groupId,
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
                    onChange={e => onChange({ date, teacherId, groupId, classroom, subject: e.target.value })}
                />
            </div>

            <div className="schedule-filters__action">
                <button className="schedule-filters__submit" onClick={onSearch}>Найти</button>
            </div>
        </div>
    );
}