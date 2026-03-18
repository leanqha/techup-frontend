import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchTeachers } from '../api/schedule.ts';
import type { Profile as AccountProfile } from '../api/types/types.ts';
import { Loader } from '../components/Loader.tsx';
import { Popup } from '../components/ui/Popup.tsx';
import { CloseIcon } from '../components/icons/CloseIcon.tsx';
import './TeachersPage.css';

function formatTeacherName(teacher: AccountProfile) {
    const parts = [teacher.last_name, teacher.first_name, teacher.middle_name].filter(Boolean);
    return parts.length ? parts.join(' ') : teacher.email || teacher.uid;
}

export function TeachersPage() {
    const navigate = useNavigate();

    const [teachers, setTeachers] = useState<AccountProfile[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedTeacher, setSelectedTeacher] = useState<AccountProfile | null>(null);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError(null);

            try {
                const data = await fetchTeachers();
                if (!cancelled) {
                    setTeachers(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Ошибка загрузки преподавателей');
                    setTeachers([]);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void load();

        return () => {
            cancelled = true;
        };
    }, []);

    const filteredTeachers = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return teachers;

        return teachers.filter(teacher => {
            const fullName = formatTeacherName(teacher).toLowerCase();
            const email = teacher.email?.toLowerCase() ?? '';
            const uid = teacher.uid?.toLowerCase() ?? '';
            return fullName.includes(query) || email.includes(query) || uid.includes(query);
        });
    }, [search, teachers]);

    const openTeacher = (teacher: AccountProfile) => {
        setSelectedTeacher(teacher);
    };

    const goToTeacherSchedule = (teacher: AccountProfile) => {
        navigate(`/schedule?teacherId=${teacher.id}`);
        setSelectedTeacher(null);
    };

    return (
        <div className="teachers-page">
            <header className="teachers-page__header">
                <h1>Преподаватели</h1>
                <p>Найдите преподавателя и откройте его карточку</p>
            </header>

            <label className="teachers-page__search">
                Поиск
                <input
                    type="text"
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    placeholder="ФИО, email или uid"
                />
            </label>

            {loading && <Loader />}
            {error && <p className="teachers-page__error">{error}</p>}

            {!loading && !error && (
                <div className="teachers-page__grid">
                    {filteredTeachers.map(teacher => (
                        <button
                            key={teacher.id}
                            type="button"
                            className="teachers-page__card"
                            onClick={() => openTeacher(teacher)}
                        >
                            <span className="teachers-page__card-name">{formatTeacherName(teacher)}</span>
                            <span className="teachers-page__card-meta">ID: {teacher.id}</span>
                        </button>
                    ))}
                </div>
            )}

            {!loading && !error && filteredTeachers.length === 0 && (
                <p className="teachers-page__empty">Ничего не найдено</p>
            )}

            <Popup
                open={Boolean(selectedTeacher)}
                onClose={() => setSelectedTeacher(null)}
                overlayClassName="teachers-page__popup-overlay"
                contentClassName="teachers-page__popup"
                ariaLabel="Карточка преподавателя"
            >
                {selectedTeacher && (
                    <div className="teachers-page__modal">
                        <div className="teachers-page__modal-header">
                            <h2>{formatTeacherName(selectedTeacher)}</h2>
                            <button
                                type="button"
                                className="teachers-page__modal-close"
                                onClick={() => setSelectedTeacher(null)}
                                aria-label="Закрыть карточку преподавателя"
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        <div className="teachers-page__modal-body">
                            <p><b>Имя:</b> {selectedTeacher.first_name || '—'}</p>
                            <p><b>Фамилия:</b> {selectedTeacher.last_name || '—'}</p>
                            <p><b>Отчество:</b> {selectedTeacher.middle_name || '—'}</p>
                            <p><b>Email:</b> {selectedTeacher.email || '—'}</p>
                        </div>

                        <button
                            type="button"
                            className="teachers-page__modal-action"
                            onClick={() => goToTeacherSchedule(selectedTeacher)}
                        >
                            Посмотреть расписание
                        </button>
                    </div>
                )}
            </Popup>
        </div>
    );
}

