import { useEffect, useState } from 'react';
import {
    createFaculty,
    createGroup,
    createLesson,
    deleteFaculty,
    deleteGroup,
    deleteLesson,
    listFaculties,
    listGroups,
    searchAdminLessons,
    updateFaculty,
    updateGroup,
    updateLesson,
    type Faculty,
    type GroupPayload,
    type GroupRecord,
    type LessonPayload,
    type LessonRecord,
    type LessonSearchFilters,
} from '../../api/adminSchedule';
import './AdminScheduleManager.css';

type TabKey = 'faculties' | 'groups' | 'lessons';

type GroupFormState = {
    name: string;
    course: string;
    degree: string;
    facultyID: string;
    yearStart: string;
    specialization: string;
    isActive: boolean;
};

type LessonFormState = {
    date: string;
    start_time: string;
    end_time: string;
    subject: string;
    type: string;
    classroom: string;
    group: string;
    teacher_id: string;
};

const emptyGroupForm: GroupFormState = {
    name: '',
    course: '1',
    degree: 'бакалавриат',
    facultyID: '',
    yearStart: String(new Date().getFullYear()),
    specialization: '',
    isActive: true,
};

const emptyLessonForm: LessonFormState = {
    date: '',
    start_time: '09:00',
    end_time: '10:30',
    subject: '',
    type: 'lecture',
    classroom: '',
    group: '',
    teacher_id: '',
};

const emptyFilters: LessonSearchFilters = {
    date: '',
    groupId: undefined,
    teacherId: undefined,
    subject: '',
    classroom: '',
};

export function AdminScheduleManager() {
    const [tab, setTab] = useState<TabKey>('faculties');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [facultyName, setFacultyName] = useState('');
    const [editingFacultyId, setEditingFacultyId] = useState<number | null>(null);

    const [groups, setGroups] = useState<GroupRecord[]>([]);
    const [groupForm, setGroupForm] = useState<GroupFormState>(emptyGroupForm);
    const [editingGroupId, setEditingGroupId] = useState<number | null>(null);

    const [lessons, setLessons] = useState<LessonRecord[]>([]);
    const [lessonForm, setLessonForm] = useState<LessonFormState>(emptyLessonForm);
    const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
    const [lessonFilters, setLessonFilters] = useState<LessonSearchFilters>(emptyFilters);

    const runAction = async (action: () => Promise<void>) => {
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            await action();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка запроса');
        } finally {
            setLoading(false);
        }
    };

    const loadFaculties = async () => {
        const data = await listFaculties();
        setFaculties(data);
    };

    const loadGroups = async () => {
        const data = await listGroups();
        setGroups(data);
    };

    const loadLessons = async (filters: LessonSearchFilters = lessonFilters) => {
        const data = await searchAdminLessons(filters);
        setLessons(data);
    };

    useEffect(() => {
        void runAction(async () => {
            await Promise.all([loadFaculties(), loadGroups()]);
            const initialLessons = await searchAdminLessons(emptyFilters);
            setLessons(initialLessons);
        });
    }, []);

    const resetGroupForm = () => {
        setGroupForm(emptyGroupForm);
        setEditingGroupId(null);
    };

    const resetLessonForm = () => {
        setLessonForm(emptyLessonForm);
        setEditingLessonId(null);
    };

    const handleCreateOrUpdateFaculty = () => {
        const name = facultyName.trim();
        if (!name) {
            setError('Введите название факультета');
            return;
        }

        void runAction(async () => {
            if (editingFacultyId === null) {
                await createFaculty({ name });
                setMessage('Факультет создан');
            } else {
                await updateFaculty(editingFacultyId, { id: editingFacultyId, name });
                setMessage('Факультет обновлен');
            }

            await loadFaculties();
            setFacultyName('');
            setEditingFacultyId(null);
        });
    };

    const handleDeleteFaculty = (faculty: Faculty) => {
        if (!window.confirm(`Удалить факультет "${faculty.name}"?`)) return;

        void runAction(async () => {
            await deleteFaculty(faculty.id);
            await loadFaculties();
            setMessage('Факультет удален');
        });
    };

    const toGroupPayload = (): GroupPayload => ({
        name: groupForm.name.trim(),
        course: Number(groupForm.course),
        degree: groupForm.degree.trim(),
        facultyID: Number(groupForm.facultyID),
        yearStart: Number(groupForm.yearStart),
        specialization: groupForm.specialization.trim(),
        isActive: groupForm.isActive,
    });

    const handleCreateOrUpdateGroup = () => {
        if (!groupForm.name.trim()) {
            setError('Введите название группы');
            return;
        }

        if (!groupForm.facultyID) {
            setError('Выберите факультет');
            return;
        }

        void runAction(async () => {
            const payload = toGroupPayload();
            if (editingGroupId === null) {
                await createGroup(payload);
                setMessage('Группа создана');
            } else {
                await updateGroup(editingGroupId, { id: editingGroupId, ...payload });
                setMessage('Группа обновлена');
            }

            await loadGroups();
            resetGroupForm();
        });
    };

    const handleDeleteGroup = (group: GroupRecord) => {
        if (!window.confirm(`Удалить группу "${group.name}"?`)) return;

        void runAction(async () => {
            await deleteGroup(group.id);
            await loadGroups();
            setMessage('Группа удалена');
            if (editingGroupId === group.id) resetGroupForm();
        });
    };

    const handleEditGroup = (group: GroupRecord) => {
        setEditingGroupId(group.id);
        setGroupForm({
            name: group.name,
            course: String(group.course),
            degree: group.degree,
            facultyID: String(group.facultyID),
            yearStart: String(group.yearStart),
            specialization: group.specialization,
            isActive: group.isActive,
        });
        setTab('groups');
    };

    const toLessonPayload = (): LessonPayload => ({
        date: lessonForm.date,
        start_time: lessonForm.start_time,
        end_time: lessonForm.end_time,
        subject: lessonForm.subject.trim(),
        type: lessonForm.type.trim(),
        classroom: lessonForm.classroom.trim(),
        group: Number(lessonForm.group),
        teacher_id: lessonForm.teacher_id ? Number(lessonForm.teacher_id) : null,
    });

    const handleCreateOrUpdateLesson = () => {
        if (!lessonForm.group) {
            setError('Выберите группу');
            return;
        }

        if (!lessonForm.date || !lessonForm.subject.trim()) {
            setError('Заполните дату и предмет');
            return;
        }

        void runAction(async () => {
            const payload = toLessonPayload();
            if (editingLessonId === null) {
                await createLesson(payload);
                setMessage('Занятие создано');
            } else {
                await updateLesson(editingLessonId, payload);
                setMessage('Занятие обновлено');
            }

            await loadLessons();
            resetLessonForm();
        });
    };

    const handleDeleteLesson = (lesson: LessonRecord) => {
        if (!window.confirm(`Удалить занятие "${lesson.subject}"?`)) return;

        void runAction(async () => {
            await deleteLesson(lesson.id);
            await loadLessons();
            setMessage('Занятие удалено');
            if (editingLessonId === lesson.id) resetLessonForm();
        });
    };

    const handleEditLesson = (lesson: LessonRecord) => {
        setEditingLessonId(lesson.id);
        setLessonForm({
            date: lesson.date,
            start_time: lesson.start_time,
            end_time: lesson.end_time,
            subject: lesson.subject,
            type: lesson.type,
            classroom: lesson.classroom,
            group: String(lesson.group),
            teacher_id: lesson.teacher_id ? String(lesson.teacher_id) : '',
        });
        setTab('lessons');
    };

    const handleSearchLessons = () => {
        void runAction(async () => {
            await loadLessons(lessonFilters);
            setMessage('Список занятий обновлен');
        });
    };

    return (
        <section className="admin-section admin-schedule-manager">
            <div className="admin-section-header">
                <div>
                    <h2>CRUD расписания</h2>
                    <p className="admin-section-subtitle">Факультеты, группы и занятия</p>
                </div>
            </div>

            <div className="admin-tabs" role="tablist" aria-label="Разделы CRUD">
                <button
                    type="button"
                    className={`admin-tab ${tab === 'faculties' ? 'active' : ''}`}
                    onClick={() => setTab('faculties')}
                >
                    Факультеты
                </button>
                <button
                    type="button"
                    className={`admin-tab ${tab === 'groups' ? 'active' : ''}`}
                    onClick={() => setTab('groups')}
                >
                    Группы
                </button>
                <button
                    type="button"
                    className={`admin-tab ${tab === 'lessons' ? 'active' : ''}`}
                    onClick={() => setTab('lessons')}
                >
                    Занятия
                </button>
            </div>

            {error && <p className="admin-section-error">{error}</p>}
            {message && <p className="admin-section-message">{message}</p>}

            {tab === 'faculties' && (
                <div className="admin-crud-panel">
                    <div className="admin-crud-form-row">
                        <input
                            type="text"
                            value={facultyName}
                            onChange={event => setFacultyName(event.target.value)}
                            placeholder="Название факультета"
                        />
                        <button
                            type="button"
                            className="admin-primary-button"
                            disabled={loading}
                            onClick={handleCreateOrUpdateFaculty}
                        >
                            {editingFacultyId === null ? 'Создать' : 'Сохранить'}
                        </button>
                        {editingFacultyId !== null && (
                            <button
                                type="button"
                                className="admin-secondary-button"
                                onClick={() => {
                                    setEditingFacultyId(null);
                                    setFacultyName('');
                                }}
                            >
                                Отмена
                            </button>
                        )}
                    </div>

                    <div className="admin-simple-list">
                        {faculties.map(faculty => (
                            <div key={faculty.id} className="admin-simple-list-item">
                                <span>{faculty.name}</span>
                                <div className="admin-accounts-actions">
                                    <button
                                        type="button"
                                        className="admin-secondary-button"
                                        onClick={() => {
                                            setEditingFacultyId(faculty.id);
                                            setFacultyName(faculty.name);
                                        }}
                                    >
                                        Изменить
                                    </button>
                                    <button
                                        type="button"
                                        className="admin-danger-button"
                                        onClick={() => handleDeleteFaculty(faculty)}
                                    >
                                        Удалить
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {tab === 'groups' && (
                <div className="admin-crud-panel">
                    <div className="admin-grid-form">
                        <label className="admin-field">
                            Название
                            <input
                                type="text"
                                value={groupForm.name}
                                onChange={event =>
                                    setGroupForm({ ...groupForm, name: event.target.value })
                                }
                            />
                        </label>
                        <label className="admin-field">
                            Факультет
                            <select
                                value={groupForm.facultyID}
                                onChange={event =>
                                    setGroupForm({ ...groupForm, facultyID: event.target.value })
                                }
                            >
                                <option value="">Выберите</option>
                                {faculties.map(faculty => (
                                    <option key={faculty.id} value={faculty.id}>
                                        {faculty.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="admin-field">
                            Курс
                            <input
                                type="number"
                                value={groupForm.course}
                                onChange={event =>
                                    setGroupForm({ ...groupForm, course: event.target.value })
                                }
                            />
                        </label>
                        <label className="admin-field">
                            Уровень
                            <input
                                type="text"
                                value={groupForm.degree}
                                onChange={event =>
                                    setGroupForm({ ...groupForm, degree: event.target.value })
                                }
                            />
                        </label>
                        <label className="admin-field">
                            Год набора
                            <input
                                type="number"
                                value={groupForm.yearStart}
                                onChange={event =>
                                    setGroupForm({ ...groupForm, yearStart: event.target.value })
                                }
                            />
                        </label>
                        <label className="admin-field">
                            Специализация
                            <input
                                type="text"
                                value={groupForm.specialization}
                                onChange={event =>
                                    setGroupForm({ ...groupForm, specialization: event.target.value })
                                }
                            />
                        </label>
                        <label className="admin-field admin-field-checkbox">
                            <input
                                type="checkbox"
                                checked={groupForm.isActive}
                                onChange={event =>
                                    setGroupForm({ ...groupForm, isActive: event.target.checked })
                                }
                            />
                            Активная группа
                        </label>
                    </div>

                    <div className="admin-edit-actions">
                        {editingGroupId !== null && (
                            <button
                                type="button"
                                className="admin-secondary-button"
                                onClick={resetGroupForm}
                            >
                                Сбросить форму
                            </button>
                        )}
                        <button
                            type="button"
                            className="admin-primary-button"
                            disabled={loading}
                            onClick={handleCreateOrUpdateGroup}
                        >
                            {editingGroupId === null ? 'Создать группу' : 'Сохранить группу'}
                        </button>
                    </div>

                    <div className="admin-simple-list">
                        {groups.map(group => (
                            <div key={group.id} className="admin-simple-list-item">
                                <span>
                                    {group.name} (курс {group.course}, {group.degree})
                                </span>
                                <div className="admin-accounts-actions">
                                    <button
                                        type="button"
                                        className="admin-secondary-button"
                                        onClick={() => handleEditGroup(group)}
                                    >
                                        Изменить
                                    </button>
                                    <button
                                        type="button"
                                        className="admin-danger-button"
                                        onClick={() => handleDeleteGroup(group)}
                                    >
                                        Удалить
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {tab === 'lessons' && (
                <div className="admin-crud-panel">
                    <div className="admin-grid-form">
                        <label className="admin-field">
                            Дата
                            <input
                                type="date"
                                value={lessonForm.date}
                                onChange={event =>
                                    setLessonForm({ ...lessonForm, date: event.target.value })
                                }
                            />
                        </label>
                        <label className="admin-field">
                            Время начала
                            <input
                                type="time"
                                value={lessonForm.start_time}
                                onChange={event =>
                                    setLessonForm({ ...lessonForm, start_time: event.target.value })
                                }
                            />
                        </label>
                        <label className="admin-field">
                            Время окончания
                            <input
                                type="time"
                                value={lessonForm.end_time}
                                onChange={event =>
                                    setLessonForm({ ...lessonForm, end_time: event.target.value })
                                }
                            />
                        </label>
                        <label className="admin-field">
                            Предмет
                            <input
                                type="text"
                                value={lessonForm.subject}
                                onChange={event =>
                                    setLessonForm({ ...lessonForm, subject: event.target.value })
                                }
                            />
                        </label>
                        <label className="admin-field">
                            Тип
                            <input
                                type="text"
                                value={lessonForm.type}
                                onChange={event =>
                                    setLessonForm({ ...lessonForm, type: event.target.value })
                                }
                            />
                        </label>
                        <label className="admin-field">
                            Аудитория
                            <input
                                type="text"
                                value={lessonForm.classroom}
                                onChange={event =>
                                    setLessonForm({ ...lessonForm, classroom: event.target.value })
                                }
                            />
                        </label>
                        <label className="admin-field">
                            Группа
                            <select
                                value={lessonForm.group}
                                onChange={event =>
                                    setLessonForm({ ...lessonForm, group: event.target.value })
                                }
                            >
                                <option value="">Выберите</option>
                                {groups.map(group => (
                                    <option key={group.id} value={group.id}>
                                        {group.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="admin-field">
                            ID преподавателя
                            <input
                                type="number"
                                value={lessonForm.teacher_id}
                                onChange={event =>
                                    setLessonForm({ ...lessonForm, teacher_id: event.target.value })
                                }
                            />
                        </label>
                    </div>

                    <div className="admin-edit-actions">
                        {editingLessonId !== null && (
                            <button
                                type="button"
                                className="admin-secondary-button"
                                onClick={resetLessonForm}
                            >
                                Сбросить форму
                            </button>
                        )}
                        <button
                            type="button"
                            className="admin-primary-button"
                            disabled={loading}
                            onClick={handleCreateOrUpdateLesson}
                        >
                            {editingLessonId === null ? 'Создать занятие' : 'Сохранить занятие'}
                        </button>
                    </div>

                    <div className="admin-accounts-filters admin-lessons-filters">
                        <label className="admin-field">
                            Фильтр по дате
                            <input
                                type="date"
                                value={lessonFilters.date || ''}
                                onChange={event =>
                                    setLessonFilters({ ...lessonFilters, date: event.target.value })
                                }
                            />
                        </label>
                        <label className="admin-field">
                            Фильтр по группе
                            <select
                                value={lessonFilters.groupId ? String(lessonFilters.groupId) : ''}
                                onChange={event =>
                                    setLessonFilters({
                                        ...lessonFilters,
                                        groupId: event.target.value ? Number(event.target.value) : undefined,
                                    })
                                }
                            >
                                <option value="">Все</option>
                                {groups.map(group => (
                                    <option key={group.id} value={group.id}>
                                        {group.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <button
                            type="button"
                            className="admin-secondary-button"
                            disabled={loading}
                            onClick={handleSearchLessons}
                        >
                            Применить фильтры
                        </button>
                    </div>

                    <div className="admin-simple-list">
                        {lessons.map(lesson => (
                            <div key={lesson.id} className="admin-simple-list-item">
                                <span>
                                    {lesson.date} {lesson.start_time}-{lesson.end_time} - {lesson.subject}
                                </span>
                                <div className="admin-accounts-actions">
                                    <button
                                        type="button"
                                        className="admin-secondary-button"
                                        onClick={() => handleEditLesson(lesson)}
                                    >
                                        Изменить
                                    </button>
                                    <button
                                        type="button"
                                        className="admin-danger-button"
                                        onClick={() => handleDeleteLesson(lesson)}
                                    >
                                        Удалить
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}

