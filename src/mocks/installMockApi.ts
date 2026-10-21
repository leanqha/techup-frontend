// No-backend dev mock. Intercepts window.fetch and answers every /api/v1/*
// route with in-memory sample data, so the whole app is usable locally
// without the Go backend running. Enabled from main.tsx in dev (or when
// VITE_MOCK_API === 'true'); never touches requests outside /api/v1.
//
// Admin writes (faculties / groups / lessons / accounts) mutate the in-memory
// data so full CRUD can be exercised and verified without a backend.
import {
    CURRENT_USER,
    TEACHER_PROFILES,
    TEACHERS,
    GROUPS,
    FACULTIES,
    SUBJECTS,
    LESSON_TYPES,
    GROUP_SUBJECTS,
    CLASSROOMS,
    ROOMS,
    LESSONS,
    SLOTS,
    FACULTY_SESSIONS,
    ADMIN_ACCOUNTS,
    NOTES,
} from './data';
import type { GroupSubjectSeed, SlotSeed, FacultySessionSeed } from './data';
import type { Lesson } from '../api/types/schedule';

const API_PREFIX = '/api/v1';
const AUTH_KEY = 'techup:mock-auth';
const ROLE_KEY = 'techup:mock-role';
const LATENCY_MS = 160;

function isAuthed(): boolean {
    try {
        return localStorage.getItem(AUTH_KEY) !== '0';
    } catch {
        return true;
    }
}

function setAuthed(value: boolean) {
    try {
        localStorage.setItem(AUTH_KEY, value ? '1' : '0');
    } catch {
        /* ignore storage errors (private mode) */
    }
}

const json = (data: unknown, status = 200): Response =>
    new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });

const noContent = (): Response => new Response(null, { status: 204 });
const unauthorized = (): Response => json({ error: 'unauthorized' }, 401);
const notFound = (): Response => json({ error: 'not found' }, 404);

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

const nextId = (items: Array<{ id: number }>): number =>
    items.reduce((max, item) => Math.max(max, item.id), 0) + 1;

type Body = Record<string, unknown>;

function filterLessons(params: URLSearchParams): Lesson[] {
    const groupId = params.get('group_id');
    const teacherId = params.get('teacher_id');
    const from = params.get('from');
    const to = params.get('to');
    const date = params.get('date');
    const classroom = params.get('classroom');
    const subject = params.get('subject')?.toLowerCase();

    return LESSONS.filter(lesson => {
        if (groupId && lesson.group.id !== Number(groupId)) return false;
        if (teacherId && lesson.teacher.id !== Number(teacherId)) return false;
        if (date && lesson.date !== date) return false;
        if (from && lesson.date < from) return false;
        if (to && lesson.date > to) return false;
        if (classroom && lesson.classroom !== classroom) return false;
        if (subject && !lesson.subject.toLowerCase().includes(subject)) return false;
        return true;
    });
}

function lessonFromBody(body: Body, id: number): Lesson {
    const group = GROUPS.find(g => g.id === Number(body.group)) ?? GROUPS[0];
    const teacher =
        TEACHERS.find(t => t.id === Number(body.teacher_id)) ??
        { id: Number(body.teacher_id) || 0, first_name: '', last_name: '', middle_name: '', full_name: '' };
    const roomId = body.room_id != null ? Number(body.room_id) : undefined;
    const room = ROOMS.find(r => r.id === roomId);
    return {
        id,
        date: String(body.date ?? ''),
        start_time: String(body.start_time ?? ''),
        end_time: String(body.end_time ?? ''),
        subject: String(body.subject ?? ''),
        type: (String(body.type ?? 'other') as Lesson['type']),
        room_id: roomId,
        classroom: room ? room.name : String(body.classroom ?? ''),
        group,
        teacher,
    };
}

function idFromPath(path: string): number | null {
    const m = path.match(/\/(\d+)$/);
    return m ? Number(m[1]) : null;
}

function groupSubjectFromBody(body: Body, id: number): GroupSubjectSeed {
    const group = GROUPS.find(g => g.id === Number(body.group_id));
    const subject = SUBJECTS.find(s => s.id === Number(body.subject_id));
    const teacherId = body.teacher_id != null ? Number(body.teacher_id) : null;
    const teacher = teacherId ? TEACHERS.find(t => t.id === teacherId) : undefined;
    const lessonTypeId = body.lesson_type_id != null ? Number(body.lesson_type_id) : null;
    const lessonType = lessonTypeId ? LESSON_TYPES.find(t => t.id === lessonTypeId) : undefined;
    return {
        id,
        group_id: Number(body.group_id ?? 0),
        group_name: group ? group.name : '',
        subject_id: Number(body.subject_id ?? 0),
        subject_name: subject ? subject.name : '',
        semester: Number(body.semester ?? 0),
        teacher_id: teacherId && teacherId > 0 ? teacherId : null,
        teacher_name: teacher ? teacher.full_name : '',
        lesson_type_id: lessonType ? lessonType.id : null,
        lesson_type_name: lessonType ? lessonType.name : '',
        lesson_type_color: lessonType ? lessonType.color : '',
    };
}

function slotFromBody(body: Body, id: number): SlotSeed {
    const group = GROUPS.find(g => g.id === Number(body.group_id));
    const teacherId = body.teacher_id != null ? Number(body.teacher_id) : null;
    const teacher = teacherId ? TEACHERS.find(t => t.id === teacherId) : undefined;
    return {
        id,
        group_id: Number(body.group_id ?? 0),
        group_name: group ? group.name : '',
        semester: Number(body.semester ?? 0),
        week_parity: body.week_parity === 'even' ? 'even' : 'odd',
        weekday: Number(body.weekday ?? 1),
        start_time: String(body.start_time ?? ''),
        end_time: String(body.end_time ?? ''),
        subject: String(body.subject ?? ''),
        type: String(body.type ?? 'Другое'),
        teacher_id: teacherId && teacherId > 0 ? teacherId : null,
        teacher_name: teacher ? teacher.full_name : '',
        classroom: String(body.classroom ?? ''),
    };
}

function facultySessionFromBody(body: Body, id: number): FacultySessionSeed {
    const facultyId = Number(body.faculty_id ?? 0);
    const faculty = FACULTIES.find(f => f.id === facultyId);
    return {
        id,
        faculty_id: facultyId,
        faculty_name: faculty ? faculty.name : '',
        name: String(body.name ?? ''),
        start_date: String(body.start_date ?? ''),
        end_date: String(body.end_date ?? ''),
    };
}

// --- date helpers for lesson generation (local time, matching the app) ---
function parseLocalDate(s: string): Date {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y || 1970, (m || 1) - 1, d || 1);
}
function addDaysLocal(d: Date, n: number): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}
function isoLocal(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
function mondayOfLocal(d: Date): Date {
    const wd = (d.getDay() + 6) % 7; // Mon=0..Sun=6
    return addDaysLocal(d, -wd);
}

// Expand a group's semester slots into dated lessons, replacing that group's
// lessons in range — mirrors the Go service's expandSlots.
function generateLessonsFromSlots(body: Body): { generated: number; skipped: number } {
    const groupId = Number(body.group_id);
    const semester = Number(body.semester);
    const start = parseLocalDate(String(body.start_date ?? ''));
    const end = parseLocalDate(String(body.end_date ?? ''));
    const firstParity = body.first_week_parity === 'even' ? 'even' : 'odd';

    const group = GROUPS.find(g => g.id === groupId) ?? GROUPS[0];
    const groupSlots = SLOTS.filter(s => s.group_id === groupId && s.semester === semester);
    const skipped = groupSlots.filter(s => s.teacher_id == null).length;

    const startIso = isoLocal(start);
    const endIso = isoLocal(end);
    for (let i = LESSONS.length - 1; i >= 0; i--) {
        const l = LESSONS[i];
        if (l.group.id === groupId && l.date >= startIso && l.date <= endIso) LESSONS.splice(i, 1);
    }

    const monday = mondayOfLocal(start);
    let nextId = LESSONS.reduce((max, l) => Math.max(max, l.id), 0) + 1;
    let generated = 0;
    for (let week = 0; ; week++) {
        const weekMonday = addDaysLocal(monday, week * 7);
        if (weekMonday > end) break;
        const parity = week % 2 === 0 ? firstParity : firstParity === 'odd' ? 'even' : 'odd';
        for (const slot of groupSlots) {
            if (slot.week_parity !== parity || slot.teacher_id == null) continue;
            const date = addDaysLocal(weekMonday, slot.weekday - 1);
            if (date < start || date > end) continue;
            const teacher =
                TEACHERS.find(t => t.id === slot.teacher_id) ??
                { id: slot.teacher_id ?? 0, first_name: '', last_name: '', middle_name: '', full_name: slot.teacher_name };
            LESSONS.push({
                id: nextId++,
                date: isoLocal(date),
                start_time: slot.start_time,
                end_time: slot.end_time,
                subject: slot.subject,
                type: slot.type as Lesson['type'],
                classroom: slot.classroom,
                group,
                teacher,
            });
            generated++;
        }
    }
    return { generated, skipped };
}

function route(method: string, path: string, params: URLSearchParams, body: Body): Response {
    // ---- Account / auth ----
    if (path === '/account/secure/profile') return isAuthed() ? json(CURRENT_USER) : unauthorized();
    if (path === '/account/refresh') return isAuthed() ? json({ ok: true }) : unauthorized();
    if (path === '/account/login' || path === '/account/register') {
        setAuthed(true);
        return json({ ok: true });
    }
    if (path === '/account/secure/logout') {
        setAuthed(false);
        return noContent();
    }
    if (path === '/account/secure/dev/role' && method === 'POST') {
        const role = String(body.role ?? '');
        if (['student', 'teacher', 'admin'].includes(role)) {
            CURRENT_USER.role = role;
            try {
                localStorage.setItem(ROLE_KEY, role);
            } catch {
                /* ignore */
            }
        }
        return json(CURRENT_USER);
    }
    if (path === '/account/forgot-password')
        return json({ message: 'Ссылка для восстановления отправлена на почту (демо-режим).' });
    if (path === '/account/reset-password')
        return json({ message: 'Пароль успешно обновлён (демо-режим).' });

    // ---- Schedule (reads) ----
    if (path === '/schedule/lessons' || path === '/schedule/search') return json(filterLessons(params));
    if (path === '/schedule/teachers') return json(TEACHER_PROFILES);
    if (path === '/schedule/groups') return json(GROUPS);
    if (path === '/schedule/faculties') return json(FACULTIES);
    if (path === '/schedule/subjects') return json(SUBJECTS);
    if (path === '/schedule/lesson-types') return json(LESSON_TYPES);
    if (path === '/schedule/group-subjects') {
        const groupId = params.get('group_id');
        const semester = params.get('semester');
        return json(
            GROUP_SUBJECTS.filter(item => {
                if (groupId && item.group_id !== Number(groupId)) return false;
                if (semester && item.semester !== Number(semester)) return false;
                return true;
            }),
        );
    }
    if (path === '/schedule/slots') {
        const groupId = params.get('group_id');
        const semester = params.get('semester');
        const teacherId = params.get('teacher_id');
        return json(
            SLOTS.filter(s => {
                if (groupId && s.group_id !== Number(groupId)) return false;
                if (semester && s.semester !== Number(semester)) return false;
                if (teacherId && s.teacher_id !== Number(teacherId)) return false;
                return true;
            }),
        );
    }
    if (path === '/schedule/faculty-sessions') {
        const facultyId = params.get('faculty_id');
        return json(
            FACULTY_SESSIONS.filter(s => !facultyId || s.faculty_id === Number(facultyId)),
        );
    }
    if (path === '/schedule/classrooms') return json(CLASSROOMS);
    if (path === '/schedule/rooms') return json(ROOMS);

    // ---- Lesson notes ----
    const noteMatch = path.match(/^\/schedule\/lessons\/(\d+)\/note$/);
    if (noteMatch) {
        const lessonId = Number(noteMatch[1]);
        if (method === 'GET') {
            const text = NOTES.get(lessonId);
            if (!text) return noContent();
            const now = new Date().toISOString();
            return json({ id: lessonId, lesson_id: lessonId, text, created_at: now, updated_at: now });
        }
        if (method === 'POST') {
            NOTES.set(lessonId, String(body.text ?? ''));
            return json({ ok: true });
        }
        if (method === 'DELETE') {
            NOTES.delete(lessonId);
            return noContent();
        }
    }

    // ---- Admin: faculties ----
    if (path === '/admin/faculty' && method === 'POST') {
        const faculty = { id: nextId(FACULTIES), name: String(body.name ?? '') };
        FACULTIES.push(faculty);
        return json(faculty, 201);
    }
    if (path.startsWith('/admin/faculty/')) {
        const id = idFromPath(path);
        const idx = FACULTIES.findIndex(f => f.id === id);
        if (idx === -1) return notFound();
        if (method === 'DELETE') {
            FACULTIES.splice(idx, 1);
            return noContent();
        }
        if (method === 'PUT') {
            FACULTIES[idx] = { ...FACULTIES[idx], name: String(body.name ?? FACULTIES[idx].name) };
            return json(FACULTIES[idx]);
        }
    }

    // ---- Admin: groups ----
    if (path === '/admin/group' && method === 'POST') {
        const group = {
            id: nextId(GROUPS),
            faculty_id: Number(body.faculty_id ?? 0),
            name: String(body.name ?? ''),
            course: Number(body.course ?? 0),
            degree: String(body.degree ?? ''),
            year_start: Number(body.year_start ?? 0),
            specialization: String(body.specialization ?? ''),
            is_active: Boolean(body.is_active ?? true),
        };
        GROUPS.push(group);
        return json(group, 201);
    }
    if (path.startsWith('/admin/group/')) {
        const id = idFromPath(path);
        const idx = GROUPS.findIndex(g => g.id === id);
        if (idx === -1) return notFound();
        if (method === 'DELETE') {
            GROUPS.splice(idx, 1);
            return noContent();
        }
        if (method === 'PUT') {
            GROUPS[idx] = {
                ...GROUPS[idx],
                faculty_id: Number(body.faculty_id ?? GROUPS[idx].faculty_id),
                name: String(body.name ?? GROUPS[idx].name),
                course: Number(body.course ?? GROUPS[idx].course),
                degree: String(body.degree ?? GROUPS[idx].degree),
                year_start: Number(body.year_start ?? GROUPS[idx].year_start),
                specialization: String(body.specialization ?? GROUPS[idx].specialization),
                is_active: Boolean(body.is_active ?? GROUPS[idx].is_active),
            };
            return json(GROUPS[idx]);
        }
    }

    // ---- Admin: subjects ----
    if (path === '/admin/subject' && method === 'POST') {
        const name = String(body.name ?? '').trim();
        if (SUBJECTS.some(s => s.name.toLowerCase() === name.toLowerCase())) {
            return json({ error: 'subject already exists' }, 409);
        }
        const subject = { id: nextId(SUBJECTS), name };
        SUBJECTS.push(subject);
        return json(subject, 201);
    }
    if (path.startsWith('/admin/subject/')) {
        const id = idFromPath(path);
        const idx = SUBJECTS.findIndex(s => s.id === id);
        if (idx === -1) return notFound();
        if (method === 'DELETE') {
            SUBJECTS.splice(idx, 1);
            return noContent();
        }
        if (method === 'PUT') {
            const name = String(body.name ?? SUBJECTS[idx].name).trim();
            if (SUBJECTS.some(s => s.id !== id && s.name.toLowerCase() === name.toLowerCase())) {
                return json({ error: 'subject already exists' }, 409);
            }
            SUBJECTS[idx] = { ...SUBJECTS[idx], name };
            return json(SUBJECTS[idx]);
        }
    }

    // ---- Admin: lesson types ----
    if (path === '/admin/lesson-type' && method === 'POST') {
        const name = String(body.name ?? '').trim();
        if (LESSON_TYPES.some(t => t.name.toLowerCase() === name.toLowerCase())) {
            return json({ error: 'lesson type already exists' }, 409);
        }
        const lessonType = { id: nextId(LESSON_TYPES), name, color: String(body.color ?? '#64748b') };
        LESSON_TYPES.push(lessonType);
        return json(lessonType, 201);
    }
    if (path.startsWith('/admin/lesson-type/')) {
        const id = idFromPath(path);
        const idx = LESSON_TYPES.findIndex(t => t.id === id);
        if (idx === -1) return notFound();
        if (method === 'DELETE') {
            LESSON_TYPES.splice(idx, 1);
            return noContent();
        }
        if (method === 'PUT') {
            const name = String(body.name ?? LESSON_TYPES[idx].name).trim();
            if (LESSON_TYPES.some(t => t.id !== id && t.name.toLowerCase() === name.toLowerCase())) {
                return json({ error: 'lesson type already exists' }, 409);
            }
            LESSON_TYPES[idx] = {
                ...LESSON_TYPES[idx],
                name,
                color: String(body.color ?? LESSON_TYPES[idx].color),
            };
            return json(LESSON_TYPES[idx]);
        }
    }

    // ---- Admin: group semester plan (учебный план) ----
    if (path === '/admin/group-subject' && method === 'POST') {
        const record = groupSubjectFromBody(body, nextId(GROUP_SUBJECTS));
        if (
            GROUP_SUBJECTS.some(
                gs =>
                    gs.group_id === record.group_id &&
                    gs.subject_id === record.subject_id &&
                    gs.semester === record.semester,
            )
        ) {
            return json({ error: "subject already in this group's semester plan" }, 409);
        }
        GROUP_SUBJECTS.push(record);
        return json(record, 201);
    }
    if (path.startsWith('/admin/group-subject/')) {
        const id = idFromPath(path);
        const idx = GROUP_SUBJECTS.findIndex(gs => gs.id === id);
        if (idx === -1) return notFound();
        if (method === 'DELETE') {
            GROUP_SUBJECTS.splice(idx, 1);
            return noContent();
        }
        if (method === 'PUT') {
            const record = groupSubjectFromBody(body, id as number);
            if (
                GROUP_SUBJECTS.some(
                    gs =>
                        gs.id !== id &&
                        gs.group_id === record.group_id &&
                        gs.subject_id === record.subject_id &&
                        gs.semester === record.semester,
                )
            ) {
                return json({ error: "subject already in this group's semester plan" }, 409);
            }
            GROUP_SUBJECTS[idx] = record;
            return json(record);
        }
    }

    // ---- Admin: lessons ----
    if (path === '/admin/lesson' && method === 'POST') {
        const lesson = lessonFromBody(body, nextId(LESSONS));
        LESSONS.push(lesson);
        return json({ ok: true }, 201);
    }
    if (path.startsWith('/admin/lesson/')) {
        const id = idFromPath(path);
        const idx = LESSONS.findIndex(l => l.id === id);
        if (idx === -1) return notFound();
        if (method === 'DELETE') {
            LESSONS.splice(idx, 1);
            return noContent();
        }
        if (method === 'PUT') {
            LESSONS[idx] = lessonFromBody(body, id as number);
            return json({ ok: true });
        }
    }

    // ---- Admin: schedule composer slots ----
    if (path === '/admin/slot' && method === 'POST') {
        const slot = slotFromBody(body, nextId(SLOTS));
        SLOTS.push(slot);
        return json(slot, 201);
    }
    if (path.startsWith('/admin/slot/')) {
        const id = idFromPath(path);
        const idx = SLOTS.findIndex(s => s.id === id);
        if (idx === -1) return notFound();
        if (method === 'DELETE') {
            SLOTS.splice(idx, 1);
            return noContent();
        }
        if (method === 'PUT') {
            SLOTS[idx] = slotFromBody(body, id as number);
            return json(SLOTS[idx]);
        }
    }
    if (path === '/admin/schedule/generate' && method === 'POST') {
        return json(generateLessonsFromSlots(body));
    }

    // ---- Admin: faculty exam sessions (экзаменационные сессии) ----
    if (path === '/admin/faculty-session' && method === 'POST') {
        const session = facultySessionFromBody(body, nextId(FACULTY_SESSIONS));
        FACULTY_SESSIONS.push(session);
        return json(session, 201);
    }
    if (path.startsWith('/admin/faculty-session/')) {
        const id = idFromPath(path);
        const idx = FACULTY_SESSIONS.findIndex(s => s.id === id);
        if (idx === -1) return notFound();
        if (method === 'DELETE') {
            FACULTY_SESSIONS.splice(idx, 1);
            return noContent();
        }
        if (method === 'PUT') {
            FACULTY_SESSIONS[idx] = facultySessionFromBody(body, id as number);
            return json(FACULTY_SESSIONS[idx]);
        }
    }

    // ---- Admin: accounts ----
    if (path === '/admin/accounts') return json(ADMIN_ACCOUNTS);
    if (path.startsWith('/admin/account/')) {
        const id = idFromPath(path);
        const idx = ADMIN_ACCOUNTS.findIndex(a => a.id === id);
        if (idx === -1) return notFound();
        if (method === 'DELETE') {
            ADMIN_ACCOUNTS.splice(idx, 1);
            return noContent();
        }
        if (method === 'PUT') {
            ADMIN_ACCOUNTS[idx] = { ...ADMIN_ACCOUNTS[idx], ...(body as Partial<(typeof ADMIN_ACCOUNTS)[number]>) };
            return json(ADMIN_ACCOUNTS[idx]);
        }
    }
    if (path === '/admin/set-role') return json({ ok: true });
    if (path === '/admin/schedule/import') return json({ imported: true }, 201);

    // ---- Map (AdminMapPage uses static data; these are only fallbacks) ----
    if (/^\/admin\/(building|room|connection)/.test(path)) {
        return method === 'DELETE' ? noContent() : json({ ok: true }, method === 'POST' ? 201 : 200);
    }
    if (path.startsWith('/map/') || path === '/buildings' || path === '/rooms' || path === '/connections') {
        return json([]);
    }

    console.warn(`[mock] Unhandled ${method} ${API_PREFIX}${path} — returning empty response`);
    return method === 'GET' ? json([]) : json({ ok: true });
}

export function installMockApi() {
    const originalFetch = window.fetch.bind(window);

    // Seed as authenticated on first run so the demo opens straight into the app.
    try {
        if (localStorage.getItem(AUTH_KEY) === null) setAuthed(true);
        const savedRole = localStorage.getItem(ROLE_KEY);
        if (savedRole) CURRENT_USER.role = savedRole;
    } catch {
        /* ignore */
    }

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url =
            typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();

        let pathname: string;
        let search: string;
        try {
            const parsed = new URL(url, window.location.origin);
            pathname = parsed.pathname;
            search = parsed.search;
        } catch {
            return originalFetch(input, init);
        }

        // Only intercept our API; everything else (assets, HMR, fonts) passes through.
        if (!pathname.startsWith(API_PREFIX)) {
            return originalFetch(input, init);
        }

        let body: Body = {};
        if (init?.body && typeof init.body === 'string') {
            try {
                const parsed = JSON.parse(init.body);
                if (parsed && typeof parsed === 'object') body = parsed as Body;
            } catch {
                /* non-JSON body */
            }
        }

        const path = pathname.slice(API_PREFIX.length);
        const params = new URLSearchParams(search);

        await delay(LATENCY_MS);
        return route(method, path, params, body);
    };

    console.info('%c[mock] No-backend dev mode active — /api/v1 is served from in-memory data.', 'color:#2563eb;font-weight:600');
}
