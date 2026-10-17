import type {
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
} from './types/types.ts';
import { fetchWithRefresh } from './fetchWithRefresh.ts';

// Development-only: change the current user's own role. The backend exposes
// this route only when running in development mode.
export async function setDevRole(role: string): Promise<void> {
    const res = await fetchWithRefresh('/api/v1/account/secure/dev/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || 'Не удалось сменить роль');
    }
}

export async function forgotPassword(
    payload: ForgotPasswordRequest
): Promise<ForgotPasswordResponse> {
    const res = await fetch('/api/v1/account/forgot-password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const errorText = await res.text();
        const errorMessage = errorText ? errorText : `Request failed: ${res.status}`;
        throw new Error(errorMessage);
    }

    return res.json();
}

export async function resetPassword(
    payload: ResetPasswordRequest
): Promise<ResetPasswordResponse> {
    const res = await fetch('/api/v1/account/reset-password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const errorText = await res.text();
        const errorMessage = errorText ? errorText : `Request failed: ${res.status}`;
        throw new Error(errorMessage);
    }

    return res.json();
}
