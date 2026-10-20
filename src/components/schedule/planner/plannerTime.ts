// Geometry + time helpers for the schedule composer's time-grid calendar, plus
// semester (spring/fall) detection from a group's course and today's date.
import type { WeekParity } from '../../../api/schedulePlanner';

export const DAY_START_MIN = 8 * 60; // 08:00
export const DAY_END_MIN = 22 * 60; // 22:00
export const HOUR_PX = 56;
export const PX_PER_MIN = HOUR_PX / 60;
export const SNAP_MIN = 5;
export const DEFAULT_DURATION_MIN = 90;
export const MIN_DURATION_MIN = 30;
export const GRID_HEIGHT = (DAY_END_MIN - DAY_START_MIN) * PX_PER_MIN;

export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7]; // Пн..Вс
export const MAGNET_MIN = 8; // magnet radius toward :00/:30 marks
export const WEEKDAY_LABELS: Record<number, string> = {
    1: 'Пн',
    2: 'Вт',
    3: 'Ср',
    4: 'Чт',
    5: 'Пт',
    6: 'Сб',
    7: 'Вс',
};
export const WEEKDAY_FULL: Record<number, string> = {
    1: 'Понедельник',
    2: 'Вторник',
    3: 'Среда',
    4: 'Четверг',
    5: 'Пятница',
    6: 'Суббота',
    7: 'Воскресенье',
};

export const PARITIES: WeekParity[] = ['odd', 'even'];
export const PARITY_LABEL: Record<WeekParity, string> = {
    odd: 'Нечётная неделя',
    even: 'Чётная неделя',
};

export function timeToMin(t: string): number {
    const [h, m] = t.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
}

export function minToTime(min: number): string {
    const clamped = Math.max(0, Math.min(24 * 60, Math.round(min)));
    const h = Math.floor(clamped / 60);
    const m = clamped % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function snap(min: number, step = SNAP_MIN): number {
    return Math.round(min / step) * step;
}

// Snap to the 5-minute grid, with a little magnetism toward the nearest :00/:30
// mark (within MAGNET_MIN) so slots tend to land on half-hour boundaries.
export function snapTime(min: number): number {
    const base = Math.round(min / SNAP_MIN) * SNAP_MIN;
    const half = Math.round(base / 30) * 30;
    return Math.abs(base - half) <= MAGNET_MIN ? half : base;
}

export function clampMin(min: number): number {
    return Math.max(DAY_START_MIN, Math.min(DAY_END_MIN, min));
}

export function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
    return aStart < bEnd && bStart < aEnd;
}

export function minToY(min: number): number {
    return (min - DAY_START_MIN) * PX_PER_MIN;
}

export function yToMin(y: number): number {
    return DAY_START_MIN + y / PX_PER_MIN;
}

// Hour marks for the time axis / gridlines (08:00 .. 22:00).
export const HOUR_MARKS: number[] = (() => {
    const marks: number[] = [];
    for (let m = DAY_START_MIN; m <= DAY_END_MIN; m += 60) marks.push(m);
    return marks;
})();

export type DropTarget = { parity: WeekParity; weekday: number; minute: number };

// Finds the day column under a client point (set by the calendar via data-*),
// and the snapped minute at that vertical position. DOM-based so cross-component
// drags (sidebar → calendar) resolve without shared refs.
export function resolveDayColTarget(clientX: number, clientY: number): DropTarget | null {
    const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    const col = el?.closest('[data-daycol]') as HTMLElement | null;
    if (!col || !col.dataset.parity || !col.dataset.weekday) return null;
    const rect = col.getBoundingClientRect();
    return {
        parity: col.dataset.parity as WeekParity,
        weekday: Number(col.dataset.weekday),
        minute: clampMin(snapTime(yToMin(clientY - rect.top))),
    };
}

// Bounding rect of a specific day column, used while resizing (the pointer may
// drift off the column but the edge stays anchored to it).
export function columnRect(parity: WeekParity, weekday: number): DOMRect | null {
    const col = document.querySelector(
        `[data-daycol][data-parity="${parity}"][data-weekday="${weekday}"]`,
    ) as HTMLElement | null;
    return col ? col.getBoundingClientRect() : null;
}

export type DetectedSemester = { number: number; season: 'осенний' | 'весенний' };

// Autumn semester runs Sep–Jan, spring Feb–Aug. Within a course the autumn term
// is the odd-numbered semester, spring the even. `course` is 1-based.
export function detectSemester(course: number, now: Date = new Date()): DetectedSemester {
    const month = now.getMonth(); // 0=Jan .. 11=Dec
    const isFall = month >= 8 || month === 0; // Sep..Dec + Jan
    const safeCourse = Number.isFinite(course) && course > 0 ? course : 1;
    return {
        number: (safeCourse - 1) * 2 + (isFall ? 1 : 2),
        season: isFall ? 'осенний' : 'весенний',
    };
}

// ISO date (YYYY-MM-DD) in local time, matching the rest of the app.
export function isoDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

// Monday of the current week — a sensible default semester start.
export function mondayOfThisWeek(now: Date = new Date()): Date {
    const dow = now.getDay(); // 0=Sun..6=Sat
    const diff = (dow + 6) % 7; // days since Monday
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
}
