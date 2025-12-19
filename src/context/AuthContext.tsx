import { createContext } from 'react';
import type {Profile} from '../api/types/types.ts';

export type AuthContextType = {
    profile: Profile | null;
    loading: boolean;
    refreshProfile: () => Promise<void>;
    logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);