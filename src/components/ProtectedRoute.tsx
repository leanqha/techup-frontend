// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type {JSX} from "react";

export function ProtectedRoute({ children }: { children: JSX.Element }) {
    const { profile, loading } = useAuth();

    if (loading) {
        return <p>Loading...</p>;
    }

    if (!profile) {
        return <Navigate to="/auth" replace />;
    }

    return children;
}