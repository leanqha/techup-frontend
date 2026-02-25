// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth.ts';
import type {JSX} from "react";
import {Loader} from "../Loader.tsx";

export function ProtectedRoute({ children }: { children: JSX.Element }) {
    const { profile, loading } = useAuth();

    if (loading) {
        return <Loader />;
    }

    if (!profile) {
        return <Navigate to="/auth" replace />;
    }

    return children;
}