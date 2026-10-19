// Single in-flight refresh shared by every caller: parallel 401s (e.g. several
// requests firing on page load) must trigger exactly one /refresh, then all
// retry. The promise itself is the lock — it's cleared once settled so the next
// expiry starts a fresh refresh.
let refreshPromise: Promise<Response> | null = null;

export async function fetchWithRefresh(
    input: RequestInfo,
    init?: RequestInit
): Promise<Response> {
    const res = await fetch(input, {
        ...init,
        credentials: 'include',
    });

    if (res.status !== 401) {
        return res; // access token валиден
    }

    if (!refreshPromise) {
        refreshPromise = fetch('/api/v1/account/refresh', {
            method: 'POST',
            credentials: 'include',
        }).finally(() => {
            refreshPromise = null;
        });
    }

    const refreshRes = await refreshPromise;

    if (!refreshRes.ok) {
        throw new Error('Сессия истекла');
    }

    // Повторяем исходный запрос с обновлёнными куками
    return fetch(input, {
        ...init,
        credentials: 'include',
    });
}