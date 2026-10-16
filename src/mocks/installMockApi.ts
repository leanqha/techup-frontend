// No-backend dev mock. Intercepts window.fetch and answers every /api/v1/*
// route with in-memory sample data, so the whole app is usable locally
// without the Go backend running. Enabled from main.tsx in dev (or when
// VITE_MOCK_API === 'true'); never touches requests outside /api/v1.
import {
    CURRENT_USER,
    TEACHER_PROFILES,
    GROUPS,
    FACULTIES,
    CLASSROOMS,
    LESSONS,
    ADMIN_ACCOUNTS,
    NOTES,
} from './data';
import type { Lesson } from '../api/types/schedule';

const API_PREFIX = '/api/v1';
const AUTH_KEY = 'techup:mock-auth';
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

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

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

function route(method: string, path: string, params: URLSearchParams, body: unknown): Response {
    // ---- Account / auth ----
    if (path === '/account/secure/profile') {
        return isAuthed() ? json(CURRENT_USER) : unauthorized();
    }
    if (path === '/account/refresh') {
        return isAuthed() ? json({ ok: true }) : unauthorized();
    }
    if (path === '/account/login' || path === '/account/register') {
        setAuthed(true);
        return json({ ok: true });
    }
    if (path === '/account/secure/logout') {
        setAuthed(false);
        return noContent();
    }
    if (path === '/account/forgot-password') {
        return json({ message: 'Ссылка для восстановления отправлена на почту (демо-режим).' });
    }
    if (path === '/account/reset-password') {
        return json({ message: 'Пароль успешно обновлён (демо-режим).' });
    }

    // ---- Schedule (reads) ----
    if (path === '/schedule/lessons' || path === '/schedule/search') {
        return json(filterLessons(params));
    }
    if (path === '/schedule/teachers') return json(TEACHER_PROFILES);
    if (path === '/schedule/groups') return json(GROUPS);
    if (path === '/schedule/faculties') return json(FACULTIES);
    if (path === '/schedule/classrooms') return json(CLASSROOMS);

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
            const text = (body as { text?: string } | undefined)?.text ?? '';
            NOTES.set(lessonId, text);
            const now = new Date().toISOString();
            return json({ id: lessonId, lesson_id: lessonId, text, created_at: now, updated_at: now });
        }
        if (method === 'DELETE') {
            NOTES.delete(lessonId);
            return noContent();
        }
    }

    // ---- Admin accounts ----
    if (path === '/admin/accounts') return json(ADMIN_ACCOUNTS);
    if (/^\/admin\/account\/\d+$/.test(path)) {
        return method === 'DELETE' ? noContent() : json({ ok: true });
    }

    // ---- Admin schedule CRUD (writes succeed in the demo) ----
    if (path === '/admin/schedule/import') return json({ imported: true }, 201);
    if (/^\/admin\/(faculty|group|lesson|room|connection)(\/\d+)?$/.test(path)) {
        return method === 'DELETE' ? noContent() : json({ ok: true }, method === 'POST' ? 201 : 200);
    }

    // ---- Map (AdminMapPage uses static data; these are only fallbacks) ----
    if (path.startsWith('/map/') || path === '/buildings' || path === '/rooms' || path === '/connections') {
        return json([]);
    }

    // ---- Unknown /api/v1 route ----
    console.warn(`[mock] Unhandled ${method} ${API_PREFIX}${path} — returning empty response`);
    return method === 'GET' ? json([]) : json({ ok: true });
}

export function installMockApi() {
    const originalFetch = window.fetch.bind(window);

    // Seed as authenticated on first run so the demo opens straight into the app.
    try {
        if (localStorage.getItem(AUTH_KEY) === null) setAuthed(true);
    } catch {
        /* ignore */
    }

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url =
            typeof input === 'string'
                ? input
                : input instanceof URL
                    ? input.href
                    : input.url;
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

        let body: unknown;
        if (init?.body && typeof init.body === 'string') {
            try {
                body = JSON.parse(init.body);
            } catch {
                body = init.body;
            }
        }

        const path = pathname.slice(API_PREFIX.length);
        const params = new URLSearchParams(search);

        await delay(LATENCY_MS);
        return route(method, path, params, body);
    };

    console.info('%c[mock] No-backend dev mode active — /api/v1 is served from in-memory data.', 'color:#2563eb;font-weight:600');
}
