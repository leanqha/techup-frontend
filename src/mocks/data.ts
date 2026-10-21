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

// Rooms table analogue (id + name) so the admin lesson form's classroom
// dropdown works in no-backend dev mode and lessons can reference a room id.
export const ROOMS = CLASSROOMS.map((name, index) => ({
    id: index + 1,
    name,
    title: '',
}));

// Subjects catalog analogue (id + name) so the admin subjects CRUD and the
// lesson form's subject dropdown work in no-backend dev mode.
export const SUBJECTS = [
    'Математический анализ',
    'Программирование',
    'Базы данных',
    'Операционные системы',
    'Веб-разработка',
    'Дискретная математика',
    'Английский язык',
    'Компьютерные сети',
].map((name, index) => ({ id: index + 1, name }));

// Lesson types catalog analogue (id + name + accent color), mirroring the
// backend seed, so the types admin CRUD and the lesson form's type dropdown
// work in no-backend dev mode.
export const LESSON_TYPES = [
    { id: 1, name: 'Лекция', color: '#2563eb' },
    { id: 2, name: 'Практика', color: '#dc2626' },
    { id: 3, name: 'Лабораторная', color: '#7c3aed' },
    { id: 4, name: 'Экзамен', color: '#ea580c' },
    { id: 5, name: 'Зачет', color: '#059669' },
    { id: 6, name: 'Другое', color: '#64748b' },
];

const TYPES: LessonType[] = LESSON_TYPES.slice(0, 5).map(t => t.name);
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
                    subject: SUBJECTS[pick % SUBJECTS.length].name,
                    type: TYPES[pick % TYPES.length],
                    classroom: CLASSROOMS[pick % CLASSROOMS.length],
                    room_id: (pick % CLASSROOMS.length) + 1,
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

// Group semester plan analogue (учебный план): which subjects a group studies
// in a given semester, with an optional teacher. Mirrors the backend
// GroupSubjectResponse shape so the admin CRUD works in no-backend dev mode.
export type GroupSubjectSeed = {
    id: number;
    group_id: number;
    group_name: string;
    subject_id: number;
    subject_name: string;
    semester: number;
    teacher_id: number | null;
    teacher_name: string;
    lesson_type_id: number | null;
    lesson_type_name: string;
    lesson_type_color: string;
};

function buildGroupSubjects(): GroupSubjectSeed[] {
    const group = GROUPS[0]; // ИС-21
    // [subjectIndex, semester, teacherId, lessonTypeId]
    const plan: Array<[number, number, number | null, number | null]> = [
        [0, 3, 11, 1],
        [1, 3, 12, 2],
        [2, 3, 13, 3],
        [3, 4, 11, 1],
        [4, 4, null, null],
    ];

    return plan.map(([subjectIndex, semester, teacherId, lessonTypeId], i) => {
        const subject = SUBJECTS[subjectIndex];
        const teacher = teacherId ? TEACHERS.find(t => t.id === teacherId) : undefined;
        const lessonType = lessonTypeId
            ? LESSON_TYPES.find(t => t.id === lessonTypeId)
            : undefined;
        return {
            id: i + 1,
            group_id: group.id,
            group_name: group.name,
            subject_id: subject.id,
            subject_name: subject.name,
            semester,
            teacher_id: teacherId,
            teacher_name: teacher ? teacher.full_name : '',
            lesson_type_id: lessonType ? lessonType.id : null,
            lesson_type_name: lessonType ? lessonType.name : '',
            lesson_type_color: lessonType ? lessonType.color : '',
        };
    });
}

export const GROUP_SUBJECTS: GroupSubjectSeed[] = buildGroupSubjects();

// Schedule composer slots (two-week template). Seeded for ИС-21 (semester 3),
// plus one slot for ПИ-22 sharing teacher #11 at the same odd-Monday 09:00 time
// so the cross-group teacher-clash warning is visible out of the box.
export type SlotSeed = {
    id: number;
    group_id: number;
    group_name: string;
    semester: number;
    week_parity: 'odd' | 'even';
    weekday: number;
    start_time: string;
    end_time: string;
    subject: string;
    type: string;
    teacher_id: number | null;
    teacher_name: string;
    classroom: string;
};

function makeSlot(
    id: number,
    groupId: number,
    semester: number,
    parity: 'odd' | 'even',
    weekday: number,
    start: string,
    end: string,
    subject: string,
    type: string,
    teacherId: number | null,
    classroom: string,
): SlotSeed {
    const group = GROUPS.find(g => g.id === groupId);
    const teacher = teacherId ? TEACHERS.find(t => t.id === teacherId) : undefined;
    return {
        id,
        group_id: groupId,
        group_name: group ? group.name : '',
        semester,
        week_parity: parity,
        weekday,
        start_time: start,
        end_time: end,
        subject,
        type,
        teacher_id: teacherId,
        teacher_name: teacher ? teacher.full_name : '',
        classroom,
    };
}

export const SLOTS: SlotSeed[] = [
    makeSlot(1, 101, 3, 'odd', 1, '09:00', '10:30', 'Математический анализ', 'Лекция', 11, 'А-101'),
    makeSlot(2, 101, 3, 'odd', 1, '10:45', '12:15', 'Программирование', 'Практика', 12, 'Б-204'),
    makeSlot(3, 101, 3, 'even', 3, '09:00', '10:30', 'Базы данных', 'Лабораторная', 13, 'В-305'),
    makeSlot(4, 102, 3, 'odd', 1, '09:00', '10:30', 'Веб-разработка', 'Лекция', 11, 'Г-410'),
];

// Faculty exam sessions (экзаменационные сессии): период с датами начала и
// конца для каждого факультета. У факультета может быть несколько сессий.
export type FacultySessionSeed = {
    id: number;
    faculty_id: number;
    faculty_name: string;
    name: string;
    start_date: string; // YYYY-MM-DD
    end_date: string;
};

function makeFacultySession(
    id: number,
    facultyId: number,
    name: string,
    start: string,
    end: string,
): FacultySessionSeed {
    const faculty = FACULTIES.find(f => f.id === facultyId);
    return {
        id,
        faculty_id: facultyId,
        faculty_name: faculty ? faculty.name : '',
        name,
        start_date: start,
        end_date: end,
    };
}

export const FACULTY_SESSIONS: FacultySessionSeed[] = [
    makeFacultySession(1, 1, 'Зимняя сессия 2026/2027', '2027-01-12', '2027-01-31'),
    makeFacultySession(2, 1, 'Летняя сессия 2026/2027', '2027-06-08', '2027-06-28'),
    makeFacultySession(3, 2, 'Зимняя сессия 2026/2027', '2027-01-19', '2027-02-07'),
];

// In-memory lesson notes, seeded with one example.
export const NOTES = new Map<number, string>([[1, 'Повторить примеры из лекции перед семинаром.']]);
