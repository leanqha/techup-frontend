import type {
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
} from './types/types.ts';

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
        throw new Error('Failed to request password reset');
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
        throw new Error('Failed to reset password');
    }

    return res.json();
}

