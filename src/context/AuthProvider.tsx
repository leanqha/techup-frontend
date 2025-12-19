// src/context/AuthProvider.tsx
import { useEffect, useState, type ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import type {Profile} from '../api/types/types.ts';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const loadProfile = async () => {
            try {
                const res = await fetch('/api/v1/account/secure/profile', {
                    credentials: 'include',
                });

                if (!cancelled) {
                    if (res.ok) {
                        const data = await res.json();
                        setProfile(data);
                    } else {
                        setProfile(null);
                    }
                }
            } catch {
                if (!cancelled) {
                    setProfile(null);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadProfile();
        return () => {
            cancelled = true;
        };
    }, []);

    const refreshProfile = async () => {
        const res = await fetch('/api/v1/account/secure/profile', {
            credentials: 'include',
        });

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
        setProfile(null);
    };

    return (
        <AuthContext.Provider
            value={{ profile, loading, refreshProfile, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
}