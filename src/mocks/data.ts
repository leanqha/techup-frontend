// Sample data for the no-backend dev mock.
// Deterministic so the app looks the same on every local run.
import type { Lesson, LessonType, Group, Faculty, Teacher } from '../api/types/schedule';
import type { Profile } from '../api/types/types';

export const CURRENT_USER: Profile = {
    id: 1,
    uid: '000123',
    email: 'student@techup.dev',
    first_name: 'Алексей',
    middle_name: 'Игоревич',
    last_name: 'Смирнов',
    group_id: 101,
    group_name: 'ИС-21',
    role: 'admin', // admin so every section (incl. Админка / Карта) is reachable in the demo
};

export const FACULTIES: Faculty[] = [
    { id: 1, name: 'Факультет информационных технологий' },
    { id: 2, name: 'Факультет инженерии' },
];

export const GROUPS: Group[] = [
    { id: 101, faculty_id: 1, name: 'ИС-21', course: 3, degree: 'бакалавриат', year_start: 2021, specialization: 'Информационные системы', is_active: true },
    { id: 102, faculty_id: 1, name: 'ПИ-22', course: 2, degree: 'бакалавриат', year_start: 2022, specialization: 'Прикладная информатика', is_active: true },
    { id: 103, faculty_id: 2, name: 'МЕХ-20', course: 4, degree: 'бакалавриат', year_start: 2020, specialization: 'Мехатроника', is_active: true },
];

type TeacherSeed = { id: number; last_name: string; first_name: string; middle_name: string };

const TEACHER_SEED: TeacherSeed[] = [
    { id: 11, last_name: 'Петров', first_name: 'Иван', middle_name: 'Петрович' },
    { id: 12, last_name: 'Иванова', first_name: 'Мария', middle_name: 'Сергеевна' },
    { id: 13, last_name: 'Кузнецов', first_name: 'Дмитрий', middle_name: 'Олегович' },
    { id: 14, last_name: 'Соколова', first_name: 'Елена', middle_name: 'Андреевна' },
];

const fullName = (t: TeacherSeed) => `${t.last_name} ${t.first_name} ${t.middle_name}`;

export const TEACHERS: Teacher[] = TEACHER_SEED.map(t => ({
    id: t.id,
    first_name: t.first_name,
    last_name: t.last_name,
    middle_name: t.middle_name,
    full_name: fullName(t),
}));

// /schedule/teachers returns account profiles.
export const TEACHER_PROFILES: Profile[] = TEACHER_SEED.map(t => ({
    id: t.id,
    uid: `T-${t.id}`,
    email: `${t.last_name.toLowerCase()}@techup.dev`,
    first_name: t.first_name,
    middle_name: t.middle_name,
    last_name: t.last_name,
    group_id: 0,
    group_name: '',
    role: 'teacher',
}));

export const CLASSROOMS = ['А-101', 'Б-204', 'В-305', 'Лаб-1', 'Г-410'];

const SUBJECTS = [
    'Математический анализ',
    'Программирование',
    'Базы данных',
    'Операционные системы',
    'Веб-разработка',
    'Дискретная математика',
    'Английский язык',
    'Компьютерные сети',
];

const TYPES: LessonType[] = ['lecture', 'practice', 'laboratory'];
const TIMES: Array<[string, string]> = [
    ['09:00', '10:30'],
    ['10:45', '12:15'],
    ['13:00', '14:30'],
    ['14:45', '16:15'],
];

function isoDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function mondayOfThisWeek(): Date {
    const now = new Date();
    const dow = now.getDay(); // 0=Sun..6=Sat
    const diff = (dow + 6) % 7; // days since Monday
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
}

// Build a deterministic set of lessons for the previous, current and next week
// (Mon–Sat), assigned to the current user's group, so Home, Schedule and week
// navigation all show content.
function buildLessons(): Lesson[] {
    const group = GROUPS[0];
    const monday = mondayOfThisWeek();
    const lessons: Lesson[] = [];
    let id = 1;
    let pick = 0;

    for (let week = -1; week <= 1; week++) {
        for (let dayIndex = 0; dayIndex <= 5; dayIndex++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + week * 7 + dayIndex);
            const perDay = 3 + (dayIndex % 2); // 3–4 lessons per day

            for (let i = 0; i < perDay; i++) {
                const [start, end] = TIMES[i % TIMES.length];
                lessons.push({
                    id: id++,
                    date: isoDate(date),
                    start_time: start,
                    end_time: end,
                    subject: SUBJECTS[pick % SUBJECTS.length],
                    type: TYPES[pick % TYPES.length],
                    classroom: CLASSROOMS[pick % CLASSROOMS.length],
                    group,
                    teacher: TEACHERS[pick % TEACHERS.length],
                });
                pick++;
            }
        }
    }

    return lessons;
}

export const LESSONS: Lesson[] = buildLessons();

export type AdminAccount = {
    id: number;
    uid: string;
    email: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    role: string;
    is_verified: boolean;
    group_id: number | null;
    group_name: string | null;
};

export const ADMIN_ACCOUNTS: AdminAccount[] = [
    { ...CURRENT_USER, is_verified: true },
    ...TEACHER_PROFILES.map(t => ({ ...t, is_verified: true })),
    {
        id: 21, uid: '000124', email: 'kate@techup.dev', first_name: 'Екатерина', middle_name: 'Павловна',
        last_name: 'Орлова', role: 'student', is_verified: false, group_id: 102, group_name: 'ПИ-22',
    },
];

// In-memory lesson notes, seeded with one example.
export const NOTES = new Map<number, string>([[1, 'Повторить примеры из лекции перед семинаром.']]);
