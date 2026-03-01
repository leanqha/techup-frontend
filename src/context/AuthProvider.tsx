import {type ReactNode, useEffect, useState } from 'react';
import { AuthContext, type AuthContextType } from './AuthContext';
import type {Profile} from '../api/types/types.ts';
import { fetchWithRefresh } from '../api/fetchWithRefresh';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const clearCookie = (name: string) => {
        document.cookie = `${name}=; Max-Age=0; path=/`;
        document.cookie = `${name}=; Max-Age=0; path=/; domain=${window.location.hostname}`;
    };

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
        await fetch('/api/v1/account/secure/logout', {
            method: 'POST',
            credentials: 'include',
        });
        clearCookie('access_token');
        clearCookie('refresh_token');
        setProfile(null);
    };

    const value: AuthContextType = { profile, loading, refreshProfile, logout };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}