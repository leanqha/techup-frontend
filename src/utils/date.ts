// src/utils/date.ts
export function formatTime(iso?: string): string {
    if (!iso) return '--:--';
    return iso.slice(11, 16);
}

export function formatDate(iso: string): string {
    return iso.slice(0, 10);
}

export function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

export function toYMD(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${dd}.${mm}.${yyyy}`;
}