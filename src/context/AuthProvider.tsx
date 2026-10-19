import {type ReactNode, useEffect, useState } from 'react';
import { AuthContext, type AuthContextType } from './AuthContext';
import type {Profile} from '../api/types/types.ts';
import { fetchWithRefresh } from '../api/fetchWithRefresh';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const loadProfile = async () => {
            try {
                const res = await fetchWithRefresh(
                    '/api/v1/account/secure/profile'
                );

                if (!cancelled) {
                    if (res.ok) {
                        const data = await res.json();
                        setProfile(data);
                    } else {
                        setProfile(null);
                    }
                }
            } catch {
                if (!cancelled) setProfile(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadProfile();

        return () => {
            cancelled = true;
        };
    }, []);

    const refreshProfile = async () => {
        const res = await fetchWithRefresh(
            '/api/v1/account/secure/profile'
        );

        if (res.ok) {
            const data = await res.json();
            setProfile(data);
        } else {
            setProfile(null);
        }
    };

    const logout = async () => {
        // The auth cookies are HttpOnly, so JS can't clear them — the backend
        // clears them via Set-Cookie on this request. Clear local state
        // regardless so the UI logs out even if the request fails.
        try {
            await fetch('/api/v1/account/secure/logout', {
                method: 'POST',
                credentials: 'include',
            });
        } finally {
            setProfile(null);
        }
    };

    const value: AuthContextType = { profile, loading, refreshProfile, logout };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}