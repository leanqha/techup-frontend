export function formatTime(iso: string): string {
    return iso.slice(11, 16);
}

export function formatDate(iso: string): string {
    // "2025-12-19T00:00:00Z" -> "2025-12-19"
    return iso.slice(0, 10);
}